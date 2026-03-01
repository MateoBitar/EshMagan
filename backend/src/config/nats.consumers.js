// src/config/nats.consumers.js
//
// Creates all JetStream durable consumers for the ESHMAGAN stream
// and starts all subscribers.
//
// Called once from app.js after connectNATS() completes.
// Each consumer is idempotent — safe to call on every startup.
// If a consumer already exists it is reused, not duplicated.
import { getJetStreamManager, SUBJECTS }  from './nats.js';
import { startFireDetectedSubscriber }    from '../events/subscribers/fireDetected.subscriber.js';
import { startAlertSubscriber }           from '../events/subscribers/alert.subscriber.js';
import { startNotificationSubscriber }    from '../events/subscribers/notification.subscriber.js';
import { startFireAssignmentSubscriber }  from '../events/subscribers/fireAssignment.subscriber.js';
import { AckPolicy, DeliverPolicy }       from 'nats';

const CONSUMERS = [
    {
        // Listens to fire.detected → publishes alert.created only (no DB write)
        name:           'fireDetected-consumer',
        filter_subject:  SUBJECTS.FIRE_DETECTED,
    },
    {
        // Listens to alert.created + evacuation.updated → creates Alerts for all roles
        name:            'alert-consumer',
        filter_subjects: [SUBJECTS.ALERT_CREATED, SUBJECTS.EVACUATION_UPDATED],
    },
    {
        // Listens to fire.risk.predicted → creates Notifications per user near zone
        name:           'notification-consumer',
        filter_subject:  SUBJECTS.FIRE_RISK_PREDICTED,
    },
    {
        // Listens to assignment.created + fire.spread
        name:            'fireAssignment-consumer',
        filter_subjects: [SUBJECTS.ASSIGNMENT_CREATED, SUBJECTS.FIRE_SPREAD],
    },
];

export async function setupNATSConsumers() {
    const jsm = getJetStreamManager();

    for (const consumer of CONSUMERS) {
        try {
            await jsm.consumers.info('ESHMAGAN', consumer.name);
            console.log(`[NATS] Consumer "${consumer.name}" already exists`);
        } catch {
            const config = {
                durable_name:   consumer.name,
                ack_policy:     AckPolicy.Explicit,
                deliver_policy: DeliverPolicy.All,
            };

            if (consumer.filter_subject)  config.filter_subject  = consumer.filter_subject;
            if (consumer.filter_subjects) config.filter_subjects = consumer.filter_subjects;

            await jsm.consumers.add('ESHMAGAN', config);
            console.log(`[NATS] Consumer "${consumer.name}" created`);
        }
    }

    await startFireDetectedSubscriber();
    await startAlertSubscriber();
    await startNotificationSubscriber();
    await startFireAssignmentSubscriber();

    console.log('[NATS] All subscribers started');
}
