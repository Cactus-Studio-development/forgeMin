"""
MONITOREO - Computer Vision Gateway Engine
Processes RTSP/ONVIF streams using YOLO + ByteTrack and dispatches operational events & metrics to NestJS API.
"""

import os
import time
import json
import logging
import requests
from typing import Dict, List, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MonitoreoVision")

API_GATEWAY_URL = os.getenv("MONITOREO_API_URL", "http://localhost:3001/api/monitoring/gateway/telemetry")
ORGANIZATION_ID = os.getenv("MONITOREO_ORG_ID", "default-org")

class MonitoreoVisionWorker:
    def __init__(self, camera_id: str, rtsp_url: str, zones: Optional[List[Dict[str, Any]]] = None):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.zones = zones or []
        self.active_tracks: Dict[int, Dict[str, Any]] = {}
        self.is_running = False

    def start_pipeline(self):
        """
        Initializes OpenCV VideoCapture, loads YOLO person detector and ByteTrack tracker.
        Dispatches aggregated events without storing biometric data.
        """
        logger.info(f"Initializing stream for Camera {self.camera_id} at {self.rtsp_url}")
        self.is_running = True
        
        # Pipeline loop abstraction
        # 1. cv2.VideoCapture(self.rtsp_url)
        # 2. Frame inference with YOLOv8/YOLOv11 (class 0: person)
        # 3. ByteTrack association (temporal track IDs)
        # 4. Point-in-polygon zone checks
        # 5. Send telemetry payload to NestJS backend

    def dispatch_telemetry(self, persons_count: int, events: List[Dict[str, Any]]):
        payload = {
            "organizationId": ORGANIZATION_ID,
            "cameraId": self.camera_id,
            "frameTimestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "currentDetections": {
                "personsCount": persons_count,
                "tracks": []
            },
            "eventsTriggered": events
        }
        try:
            res = requests.post(API_GATEWAY_URL, json=payload, timeout=5)
            logger.debug(f"Telemetry dispatched: {res.status_code}")
        except Exception as e:
            logger.error(f"Failed to post telemetry: {e}")

if __name__ == "__main__":
    logger.info("Monitoreo Computer Vision Worker ready for camera stream bindings.")
