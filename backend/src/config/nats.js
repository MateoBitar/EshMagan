// src/config/nats.js
//
// JetStream connection and stream setup.
// All NATS subjects used in EshMagan are registered here under one stream: ESHMAGAN
//
// Subjects:
//   fire.detected         → fire confirmed by infrared camera
//   fire.spread           → fire spread prediction updated or severity increased
//   fire.extinguished     → fire marked as extinguished
//   fire.risk.predicted   → FireLab predicts high fire risk in the next 6 days
//   alert.created         → alert broadcast to residents near fire
//   assignment.created    → responder assigned to a fire
//   evacuation.updated    → evacuation route status/priority changed

import { connect, StringCodec, AckPolicy, RetentionPolicy, StorageType } from 'nats';
import { NATS_URL } from './env.js';

/**
 * This file handles NATS connection, JetStream initialization,
 * stream creation, and provides utility functions for accessing
 * the messaging infrastructure.
 */

let nc = null;  // NATS connection
let js = null;  // JetStream client
let jsm = null; // JetStream manager

/**
 * String codec for encoding/decoding messages
 * 
 * PRE-CONDITIONS:
 * - NATS library must be available
 * 
 * POST-CONDITIONS:
 * - Provides encoding/decoding functionality
 */
export const sc = StringCodec();

/**
 * Define all NATS subjects used in the system
 * 
 * PRE-CONDITIONS:
 * - Subjects must follow naming conventions
 * 
 * POST-CONDITIONS:
 * - Centralized subject definitions for publishers/subscribers
 */
// All subjects under the ESHMAGAN stream
export const SUBJECTS = {
    FIRE_DETECTED:       'fire.detected',
    FIRE_SPREAD:         'fire.spread',
    FIRE_EXTINGUISHED:   'fire.extinguished',
    FIRE_RISK_PREDICTED: 'fire.risk.predicted',
    ALERT_CREATED:       'alert.created',
    ASSIGNMENT_CREATED:  'assignment.created',
    EVACUATION_UPDATED:  'evacuation.updated',
};

// CONNECTION
// Called once on startup to connect to NATS

/**
 * Establish connection to NATS and initialize JetStream
 * 
 * PRE-CONDITIONS:
 * - NATS_URL must be defined
 * 
 * POST-CONDITIONS:
 * - Initializes nc, js, and jsm
 * - Ensures stream exists
 * - Returns connection objects
 */
export async function connectNATS() {
    nc = await connect({ servers: NATS_URL });
    js  = nc.jetstream();
    jsm = await nc.jetstreamManager();

    console.log(`NATS connected: ${NATS_URL}`);

    await ensureStream();

    return { nc, js, jsm };
}

// STREAM SETUP
// Creates the ESHMAGAN stream if it doesn't already exist.
// Idempotent — safe to call on every startup.

/**
 * Ensure JetStream stream exists
 * 
 * PRE-CONDITIONS:
 * - JetStream manager must be initialized
 * 
 * POST-CONDITIONS:
 * - Creates stream if not existing
 * - Leaves existing stream unchanged
 */
async function ensureStream() {
    const streamName = 'ESHMAGAN';
    const subjects   = Object.values(SUBJECTS);

    try {
        await jsm.streams.info(streamName);
        console.log(`NATS stream "${streamName}" already exists`);
    } catch {
        // Stream doesn't exist — create it
        await jsm.streams.add({
            name:      streamName,
            subjects,
            storage:   StorageType.File,      // persist to disk — messages survive restarts
            retention: RetentionPolicy.Limits, // keep messages up to max_age
            max_age:   7 * 24 * 60 * 60 * 1e9, // 7 days in nanoseconds
        });
        console.log(`NATS stream "${streamName}" created with subjects: ${subjects.join(', ')}`);
    }
}

// GETTERS
// Used by publishers and subscribers to get the active connection

/**
 * Get active NATS connection
 * 
 * PRE-CONDITIONS:
 * - connectNATS() must be called first
 * 
 * POST-CONDITIONS:
 * - Returns NATS connection instance
 */
export function getNATSConnection() {
    if (!nc) throw new Error('NATS not connected. Call connectNATS() first.');
    return nc;
}

/**
 * Get JetStream client
 * 
 * PRE-CONDITIONS:
 * - connectNATS() must be called first
 * 
 * POST-CONDITIONS:
 * - Returns JetStream client
 */
export function getJetStream() {
    if (!js) throw new Error('JetStream not initialized. Call connectNATS() first.');
    return js;
}

/**
 * Get JetStream manager
 * 
 * PRE-CONDITIONS:
 * - connectNATS() must be called first
 * 
 * POST-CONDITIONS:
 * - Returns JetStream manager
 */
export function getJetStreamManager() {
    if (!jsm) throw new Error('JetStream manager not initialized. Call connectNATS() first.');
    return jsm;
}

// DISCONNECT

/**
 * Disconnect from NATS
 * 
 * PRE-CONDITIONS:
 * - NATS connection must exist
 * 
 * POST-CONDITIONS:
 * - Gracefully closes connection
 */
export async function disconnectNATS() {
    if (nc) {
        await nc.drain();
        console.log('NATS connection closed');
    }
}