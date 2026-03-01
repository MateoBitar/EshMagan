// src/config/nats.consumers.js
//
// Creates all JetStream push consumers for the ESHMAGAN stream
// and starts all subscribers.
//
// Called once from app.js after connectNATS() completes.
//
// Each consumer is idempotent — safe to call on every startup.
// If a consumer already exists it is reused, not duplicated.
import { getJetStreamManager, SUBJECTS }        from './nats.js';
import { startFireDetectedSubscriber }          from '../events/subscribers/fireDetected.subscriber.js';
import { startAlertSubscriber }                 from '../events/subscribers/alert.subscriber.js';
import { startNotificationSubscriber }          from '../events/subscribers/notification.subscriber.js';
import { startFireAssignmentSubscriber }        from '../events/subscribers/fireAssignment.subscriber.js';
import { AckPolicy, DeliverPolicy }             from 'nats';

// Consumer definitions — name maps to which subjects each consumer cares about
const CONSUMERS = [
    {
        name:            'fireDetected-consumer',
        filter_subject:  SUBJECTS.FIRE_DETECTED,
    },
    {
        name:            'fireRiskPredicted-consumer',
        filter_subject:  SUBJECTS.FIRE_RISK_PREDICTED,
    },
    {
        name:           'notification-consumer',
        filter_subject:  SUBJECTS.FIRE_RISK_PREDICTED,
    },
    {
        name:            'alert-consumer',
        filter_subjects: [SUBJECTS.ALERT_CREATED, SUBJECTS.EVACUATION_UPDATED],
    },
];

export async function setupNATSConsumers() {
    const jsm = getJetStreamManager();

    for (const consumer of CONSUMERS) {
        try {
            await jsm.consumers.info('ESHMAGAN', consumer.name);
            console.log(`[NATS] Consumer "${consumer.name}" already exists`);
        } catch {
            // Consumer doesn't exist — create it
            const config = {
                durable_name:   consumer.name,
                ack_policy:     AckPolicy.Explicit, // must ack every message
                deliver_policy: DeliverPolicy.All,  // replay all unacked messages on restart
            };

            // Single subject filter
            if (consumer.filter_subject) {
                config.filter_subject = consumer.filter_subject;
            }

            // Multiple subject filters
            if (consumer.filter_subjects) {
                config.filter_subjects = consumer.filter_subjects;
            }

            await jsm.consumers.add('ESHMAGAN', config);
            console.log(`[NATS] Consumer "${consumer.name}" created`);
        }
    }

    // Start all subscribers
    await startFireDetectedSubscriber();
    await startAlertSubscriber();
    await startNotificationSubscriber();
    await startFireAssignmentSubscriber();

    console.log('[NATS] All subscribers started');
}
