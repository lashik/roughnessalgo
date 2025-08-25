#!/bin/bash

# Pickleball Camera System - Raspberry Pi Installation Script
# Run this script as root or with sudo

set -e

echo "Starting Pickleball Camera System installation..."

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
apt-get install -y \
    python3 \
    python3-pip \
    python3-opencv \
    python3-dev \
    libatlas-base-dev \
    libhdf5-dev \
    libhdf5-serial-dev \
    libhdf5-103 \
    libqtgui4 \
    libqtwebkit4 \
    libqt4-test \
    python3-pyqt5 \
    libgtk-3-0 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libatlas-base-dev \
    gfortran \
    wget \
    curl \
    git \
    vim \
    htop \
    iotop \
    nethogs \
    network-manager \
    wireless-tools \
    wpasupplicant

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install --upgrade pip
pip3 install \
    opencv-python-headless \
    python-socketio[client] \
    requests \
    numpy \
    pillow \
    flask \
    flask-socketio \
    eventlet

# Create application directory
echo "Creating application directory..."
mkdir -p /opt/pickleball_camera
mkdir -p /var/log/pickleball_camera
mkdir -p /etc/pickleball_camera

# Copy application files
echo "Copying application files..."
cp raspberry_camera_client.py /opt/pickleball_camera/
cp camera_config.json /opt/pickleball_camera/ 2>/dev/null || echo "camera_config.json not found, will create default"

# Create default config if it doesn't exist
if [ ! -f /opt/pickleball_camera/camera_config.json ]; then
    cat > /opt/pickleball_camera/camera_config.json << 'EOF'
{
    "server_url": "https://czvw7hjkj7vos2-8000.proxy.runpod.net:8000",
    "court_id": "court_1",
    "camera_id": 1,
    "camera_name": "Camera 1",
    "camera_position": "north",
    "fps": 30,
    "reconnect_delay": 5,
    "heartbeat_interval": 10
}
EOF
fi

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/pickleball-camera.service << 'EOF'
[Unit]
Description=Pickleball Camera Client
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/pickleball_camera
ExecStart=/usr/bin/python3 /opt/pickleball_camera/raspberry_camera_client.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create logrotate config
echo "Creating logrotate configuration..."
cat > /etc/logrotate.d/pickleball-camera << 'EOF'
/var/log/pickleball_camera/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

# Setup WiFi configuration
echo "Setting up WiFi configuration..."
if [ -f /etc/wpa_supplicant/wpa_supplicant.conf ]; then
    echo "WiFi configuration already exists"
else
    echo "Creating WiFi configuration template..."
    cat > /etc/wpa_supplicant/wpa_supplicant.conf << 'EOF'
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

# Add your WiFi network here:
# network={
#     ssid="YOUR_WIFI_SSID"
#     psk="YOUR_WIFI_PASSWORD"
#     key_mgmt=WPA-PSK
# }
EOF
    chmod 600 /etc/wpa_supplicant/wpa_supplicant.conf
fi

# Enable services
echo "Enabling services..."
systemctl daemon-reload
systemctl enable pickleball-camera.service

# Create startup script
echo "Creating startup script..."
cat > /opt/pickleball_camera/start_camera.sh << 'EOF'
#!/bin/bash
# Startup script for Pickleball Camera

cd /opt/pickleball_camera

# Check if camera is accessible
if ! python3 -c "import cv2; cap = cv2.VideoCapture(0); print('Camera accessible:', cap.isOpened()); cap.release()" 2>/dev/null; then
    echo "Warning: Camera may not be accessible"
fi

# Start the camera client
python3 raspberry_camera_client.py
EOF

chmod +x /opt/pickleball_camera/start_camera.sh

# Create configuration script
echo "Creating configuration script..."
cat > /opt/pickleball_camera/configure_camera.sh << 'EOF'
#!/bin/bash
# Configuration script for Pickleball Camera

CONFIG_FILE="/opt/pickleball_camera/camera_config.json"

echo "Pickleball Camera Configuration"
echo "=============================="

read -p "Enter server URL (e.g., http://your-server.com:8000): " server_url
read -p "Enter court ID (e.g., court_1): " court_id
read -p "Enter camera ID (e.g., 1): " camera_id
read -p "Enter camera name (e.g., Camera 1): " camera_name
read -p "Enter camera position (e.g., north, south, east, west): " camera_position
read -p "Enter FPS (default 30): " fps
fps=${fps:-30}

# Create new config
cat > "$CONFIG_FILE" << EOF
{
    "server_url": "$server_url",
    "court_id": "$court_id",
    "camera_id": $camera_id,
    "camera_name": "$camera_name",
    "camera_position": "$camera_position",
    "fps": $fps,
    "reconnect_delay": 5,
    "heartbeat_interval": 10
}
EOF

echo "Configuration saved to $CONFIG_FILE"
echo "Restart the service with: sudo systemctl restart pickleball-camera"
EOF

chmod +x /opt/pickleball_camera/configure_camera.sh

# Create status script
echo "Creating status script..."
cat > /opt/pickleball_camera/status.sh << 'EOF'
#!/bin/bash
# Status script for Pickleball Camera

echo "Pickleball Camera System Status"
echo "==============================="

echo "Service Status:"
systemctl status pickleball-camera.service --no-pager -l

echo -e "\nCamera Hardware:"
if command -v v4l2-ctl >/dev/null 2>&1; then
    v4l2-ctl --list-devices
else
    echo "v4l2-ctl not available"
fi

echo -e "\nNetwork Status:"
ip addr show | grep -E "inet.*(wlan|eth)"

echo -e "\nRecent Logs:"
journalctl -u pickleball-camera.service -n 20 --no-pager

echo -e "\nConfiguration:"
cat /opt/pickleball_camera/camera_config.json 2>/dev/null || echo "Configuration file not found"
EOF

chmod +x /opt/pickleball_camera/status.sh

# Set permissions
echo "Setting permissions..."
chown -R root:root /opt/pickleball_camera
chmod -R 755 /opt/pickleball_camera
chmod 644 /opt/pickleball_camera/*.json

# Create desktop shortcut (if desktop environment exists)
if [ -d /home/pi/Desktop ]; then
    echo "Creating desktop shortcuts..."
    cat > /home/pi/Desktop/Start\ Pickleball\ Camera.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Start Pickleball Camera
Comment=Start the Pickleball Camera System
Exec=sudo systemctl start pickleball-camera
Icon=camera-web
Terminal=true
Categories=Utility;
EOF

    cat > /home/pi/Desktop/Stop\ Pickleball\ Camera.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Stop Pickleball Camera
Comment=Stop the Pickleball Camera System
Exec=sudo systemctl stop pickleball-camera
Icon=camera-web
Terminal=true
Categories=Utility;
EOF

    cat > /home/pi/Desktop/Configure\ Camera.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Configure Camera
Comment=Configure Pickleball Camera Settings
Exec=sudo /opt/pickleball_camera/configure_camera.sh
Icon=preferences-system
Terminal=true
Categories=Settings;
EOF

    chown -R pi:pi /home/pi/Desktop/*.desktop
    chmod +x /home/pi/Desktop/*.desktop
fi

# Final setup
echo "Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your camera settings: sudo /opt/pickleball_camera/configure_camera.sh"
echo "2. Start the service: sudo systemctl start pickleball-camera"
echo "3. Check status: sudo /opt/pickleball_camera/status.sh"
echo "4. View logs: sudo journalctl -u pickleball-camera.service -f"
echo ""
echo "The camera system will automatically start on boot."
echo "To disable auto-start: sudo systemctl disable pickleball-camera"
echo ""
echo "Configuration file: /opt/pickleball_camera/camera_config.json"
echo "Log files: /var/log/pickleball_camera/"
echo "Service: pickleball-camera.service"
