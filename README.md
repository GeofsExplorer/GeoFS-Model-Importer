# 📦 GeoFS Model Importer

A powerful GLTF/GLB model importer and aircraft replacer for GeoFS flight simulator.

## ✈️ Overview

**GeoFS Model Importer** is a userscript that enables you to load custom `.gltf` or `.glb` models directly into GeoFS. It supports placing scenery objects and even replacing your aircraft model in real-time.

This tool is designed for modders, 3D model creators, and GeoFS developers who want enhanced control over 3D models within the flight simulator environment.

## ⭐ Features

- ✅ **Import Models**: Load `.gltf` and `.glb` models directly into GeoFS
- ✅ **Aircraft Replacement**: Replace your aircraft with custom 3D models
- ✅ **Real-time Tracking**: Imported models follow aircraft position, heading, and movement
- ✅ **Precise Scaling**: 1:1 scale default with adjustable slider + numeric input control
- ✅ **Clean Interface**: Simple, draggable floating button UI
- ✅ **Auto Updates**: Automatic updates via GitHub integration
- ✅ **No Dependencies**: Works out-of-the-box with Tampermonkey
- ✅ **Multi-browser Support**: Compatible with Chrome, Firefox, Edge, and more

## 📥 Installation

### 1. Install Tampermonkey
First, install the Tampermonkey browser extension:

- **Chrome / Edge**: [Download from Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Download from Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- **Other browsers**: Visit [tampermonkey.net](https://www.tampermonkey.net)

### 2. Install the Userscript
Click the installation link below:

[![Install GeoFS Model Importer](https://img.shields.io/badge/Install-UserScript-blue?style=for-the-badge)](https://raw.githubusercontent.com/GeofsExplorer/GeoFS-Model-Importer/main/GeoFS-Model-Importer.user.js)

### 3. Launch GeoFS
Visit the [GeoFS website](https://geo-fs.com/)
You will see a **Model Importer** button in the bottom-left corner of the screen.

## 🖼 Usage Guide

### 🎯 Import Model ("Place Here")
1. Click the **Model Importer** button
2. Select a `.glb` or `.gltf` model file
3. Adjust the scale using the slider or numeric input (optional)
4. Click **Place Here**
5. The model will spawn at your aircraft's current location and rotate with your heading

### ✈️ Use Model as Aircraft
1. Select your 3D model file
2. Adjust the scale to match your preferences
3. Click **Use as Aircraft**
4. The original aircraft becomes invisible
5. Your imported model becomes the new visual aircraft representation

## 🔄 Auto Update

This script includes automatic update functionality using Tampermonkey's update mechanism:

```javascript
// @updateURL    https://raw.githubusercontent.com/GeofsExplorer/GeoFS-Model-Importer/main/GeoFS-Model-Importer.user.js
// @downloadURL  https://raw.githubusercontent.com/GeofsExplorer/GeoFS-Model-Importer/main/GeoFS-Model-Importer.user.js```

Updates pushed to the GitHub repository will automatically be distributed to all users.

## 🛠 Compatibility
|        **Feature**       |   Support Level   |
|:------------------------:|:-----------------:|
|       GeoFS Version      |        3.9+       |
|        File Types        |  `.glb`, `.gltf`  |
| Real-time Model Tracking |     ✅ Support     |
|   Aircraft Replacement   |     ✅ Support     |
|        Animations        |     ❌ Limited     |
|      Materials / PBR     | ⚠️ Partial Support |
|       Large Models       | ⚠️ May impact FPS  |

## 📂 Project Structure

### 👨‍💻 Contributors
GeofsExplorer — Main Developer & Project Creator

31124呀 — UI improvements, testing, Code Improver, Bug Finder

### 🤝 Contributing
We welcome contributions! Feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

### 📜 License
This project is released under the MIT License.
You are free to:
1. Modify and adapt the code
2. Distribute the software
3. Use commercially
4. Make private use

See the LICENSE file for full details.
