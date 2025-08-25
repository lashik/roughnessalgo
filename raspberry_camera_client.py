#!/usr/bin/env python3

import cv2
import base64
import time
import json
import socketio
import threading
import logging
import os
import sys
from pathlib import Path
import subprocess
import requests

# Configuration
SERVER_URL = "https://czvw7hjkj7vos2-8000.proxy.runpod.net:8000"  # CHANGE THIS
COURT_ID = "court_1"  # CHANGE THIS
CAMERA_ID = 1  # CHANGE THIS
CAMERA_NAME = "Camera 1"  # CHANGE THIS
CAMERA_POSITION = "north"  # CHANGE THIS
FPS = 60
RECONNECT_DELAY = 5
HEARTBEAT_INTERVAL = 10

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/pickleball_camera.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PickleballCameraClient:
    def __init__(self):
        self.sio = socketio.Client()
        self.camera = None
        self.is_connected = False
        self.is_running = False
        self.frame_count = 0
        self.last_heartbeat = time.time()
        
        # Setup socketio events
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('registered', self.on_registered)
        self.sio.on('error', self.on_error)
        
    def setup_camera(self):
        """Initialize camera with fallback options"""
        try:
            # Try USB camera first
            self.camera = cv2.VideoCapture(0)
            if not self.camera.isOpened():
                # Try CSI camera
                self.camera = cv2.VideoCapture(2)
            if not self.camera.isOpened():
                # Try different USB ports
                for i in range(4):
                    self.camera = cv2.VideoCapture(i)
                    if self.camera.isOpened():
                        break
            
            if not self.camera.isOpened():
                logger.error("No camera found")
                return False
                
            # Set camera properties
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            self.camera.set(cv2.CAP_PROP_FPS, FPS)
            self.camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            logger.info(f"Camera initialized: {self.camera.get(cv2.CAP_PROP_FRAME_WIDTH)}x{self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT)} @ {self.camera.get(cv2.CAP_PROP_FPS)}fps")
            return True
            
        except Exception as e:
            logger.error(f"Failed to setup camera: {e}")
            return False
    
    def connect_to_server(self):
        """Connect to the pickleball server"""
        try:
            logger.info(f"Connecting to server: {SERVER_URL}")
            self.sio.connect(SERVER_URL)
            return True
        except Exception as e:
            logger.error(f"Failed to connect to server: {e}")
            return False
    
    def register_camera(self):
        """Register this camera with the server"""
        try:
            self.sio.emit('register_stream', {
                'court_id': COURT_ID,
                'cam_id': CAMERA_ID,
                'fps': FPS,
                'client_type': 'camera'
            })
            return True
        except Exception as e:
            logger.error(f"Failed to register camera: {e}")
            return False
    
    def on_connect(self):
        """Called when connected to server"""
        logger.info("Connected to server")
        self.is_connected = True
        self.register_camera()
    
    def on_disconnect(self):
        """Called when disconnected from server"""
        logger.info("Disconnected from server")
        self.is_connected = False
    
    def on_registered(self, data):
        """Called when camera is registered with server"""
        if data.get('ok'):
            logger.info(f"Camera registered successfully: Court {COURT_ID}, Camera {CAMERA_ID}")
        else:
            logger.error("Failed to register camera")
    
    def on_error(self, data):
        """Called when server sends error"""
        logger.error(f"Server error: {data}")
    
    def capture_and_stream(self):
        """Main loop for capturing and streaming frames"""
        while self.is_running:
            if not self.is_connected:
                time.sleep(RECONNECT_DELAY)
                continue
                
            try:
                ret, frame = self.camera.read()
                if not ret:
                    logger.warning("Failed to read frame")
                    time.sleep(0.1)
                    continue
                
                # Resize frame for better performance
                frame = cv2.resize(frame, (640, 480))
                
                # Encode frame to JPEG
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                jpg_b64 = base64.b64encode(buffer).decode('utf-8')
                
                # Send frame to server
                self.sio.emit('frame', {
                    'court_id': COURT_ID,
                    'cam_id': CAMERA_ID,
                    'jpg_b64': jpg_b64
                })
                
                self.frame_count += 1
                
                # Heartbeat
                if time.time() - self.last_heartbeat > HEARTBEAT_INTERVAL:
                    self.sio.emit('heartbeat', {
                        'court_id': COURT_ID,
                        'cam_id': CAMERA_ID,
                        'timestamp': time.time()
                    })
                    self.last_heartbeat = time.time()
                
                # Control frame rate
                time.sleep(1.0 / FPS)
                
            except Exception as e:
                logger.error(f"Error in capture loop: {e}")
                time.sleep(0.1)
    
    def start(self):
        """Start the camera client"""
        logger.info("Starting Pickleball Camera Client")
        
        if not self.setup_camera():
            logger.error("Failed to setup camera")
            return False
        
        self.is_running = True
        
        # Start capture thread
        capture_thread = threading.Thread(target=self.capture_and_stream, daemon=True)
        capture_thread.start()
        
        # Main connection loop
        while self.is_running:
            try:
                if not self.is_connected:
                    if self.connect_to_server():
                        logger.info("Successfully connected to server")
                    else:
                        logger.warning(f"Failed to connect, retrying in {RECONNECT_DELAY} seconds")
                        time.sleep(RECONNECT_DELAY)
                else:
                    time.sleep(1)
                    
            except KeyboardInterrupt:
                logger.info("Shutting down...")
                break
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                time.sleep(RECONNECT_DELAY)
        
        self.stop()
        return True
    
    def stop(self):
        """Stop the camera client"""
        logger.info("Stopping camera client")
        self.is_running = False
        
        if self.camera:
            self.camera.release()
        
        if self.is_connected:
            self.sio.disconnect()
        
        cv2.destroyAllWindows()

def setup_wifi():
    """Setup WiFi connection"""
    try:
        # Check if WiFi is configured
        result = subprocess.run(['iwconfig'], capture_output=True, text=True)
        if 'ESSID' in result.stdout:
            logger.info("WiFi already configured")
            return True
        
        # Try to connect to default WiFi
        logger.info("Setting up WiFi connection...")
        # This would need to be customized based on your WiFi setup
        return True
        
    except Exception as e:
        logger.error(f"Failed to setup WiFi: {e}")
        return False

def main():
    """Main entry point"""
    logger.info("Pickleball Camera Client Starting...")
    
    # Setup WiFi if needed
    if not setup_wifi():
        logger.warning("WiFi setup failed, continuing with ethernet")
    
    # Create and start client
    client = PickleballCameraClient()
    
    try:
        success = client.start()
        if success:
            logger.info("Camera client completed successfully")
        else:
            logger.error("Camera client failed")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error in main: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
