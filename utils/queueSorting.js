import { PRIORITY_LEVELS, VEHICLE_STATUS } from '../lib/constants.js';

/**
 * Calculates dynamic queue position for an active vehicle.
 * Positions are computed on-the-fly to handle no-shows, emergency priority overrides, and completed departures dynamically.
 *
 * @param {Array} allQueueEntries - Complete list of queue entry documents
 * @param {String} targetVehicleId - ID of the vehicle to calculate position for
 * @returns {Object} { position: number, totalWaiting: number, estimatedWaitMinutes: number }
 */
export function calculateDynamicQueuePosition(allQueueEntries = [], targetVehicleId = null) {
  // Filter active vehicles waiting to board (exclude LOADED, COMPLETED, NO_SHOW, REJECTED)
  const activeWaitingQueue = allQueueEntries.filter(
    (v) => v.status === VEHICLE_STATUS.WAITING || v.status === VEHICLE_STATUS.READY
  );

  // Sort by priority (EMERGENCY first), then by creation timestamp
  activeWaitingQueue.sort((a, b) => {
    if (a.priority === PRIORITY_LEVELS.EMERGENCY && b.priority !== PRIORITY_LEVELS.EMERGENCY) {
      return -1;
    }
    if (a.priority !== PRIORITY_LEVELS.EMERGENCY && b.priority === PRIORITY_LEVELS.EMERGENCY) {
      return 1;
    }
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  const totalWaiting = activeWaitingQueue.length;

  if (!targetVehicleId) {
    return { position: null, totalWaiting, estimatedWaitMinutes: totalWaiting * 6 };
  }

  const targetIndex = activeWaitingQueue.findIndex((v) => v.id === targetVehicleId);

  if (targetIndex === -1) {
    // If vehicle is already loaded or completed
    const targetVeh = allQueueEntries.find((v) => v.id === targetVehicleId);
    if (targetVeh && targetVeh.status === VEHICLE_STATUS.LOADED) {
      return { position: 0, totalWaiting, estimatedWaitMinutes: 0, statusLabel: 'BOARDING / LOADED' };
    }
    return { position: null, totalWaiting, estimatedWaitMinutes: 0, statusLabel: targetVeh?.status || 'COMPLETED' };
  }

  const position = targetIndex + 1; // 1-indexed
  const estimatedWaitMinutes = (position - 1) * 6; // Approx 6 mins per turn

  return {
    position,
    totalWaiting,
    estimatedWaitMinutes,
    statusLabel: position === 1 ? 'NEXT TO BOARD' : `POSITION #${position}`,
  };
}
