// ==UserScript==
// @name         GeoFS Model Importer
// @name:zh-CN   GeoFS 模型导入器
// @name:zh-TW   GeoFS 模型匯入器
// @description  GLTF Model placer for GeoFS (1:1 scale default, matches aircraft heading)
// @description:zh-CN  GeoFS 的 GLTF 模型导入工具
// @description:zh-TW  GeoFS 的 GLTF 模型匯入工具
// @namespace    https://github.com/GeofsExplorer/GeoFS-Model-Importer
// @version      1.0.1
// @author       GeofsExplorer and 31124呀
// @match        https://www.geo-fs.com/geofs.php?v=3.9
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// @updateURL    https://raw.githubusercontent.com/GeofsExplorer/GeoFS-Model-Importer/main/GeoFS-Model-Importer.user.js
// @downloadURL  https://raw.githubusercontent.com/GeofsExplorer/GeoFS-Model-Importer/main/GeoFS-Model-Importer.user.js
// ==/UserScript==

(function() {
    'use strict';

    class ModelImporter3D {
        constructor() {
            this.scaleValue = 1.0;
            this.placedModels = [];
            this.isDraggingUI = false;
            this.dragOffset = { x: 0, y: 0 };
            this.init();
        }

        init() {
            this.createInterfaceElements();
            this.setupEventListeners();
            this.waitForGeoFSReady();
        }

        createInterfaceElements() {
            // Main control button
            const controlButton = document.createElement('div');
            controlButton.style.cssText = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                background: rgba(0,0,0,0.85);
                color: #fff;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 8px 12px;
                z-index: 6000;
                font-family: Arial, sans-serif;
                font-size: 13px;
                cursor: move;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                user-select: none;
            `;
            controlButton.innerHTML = 'Model Importer';
            document.body.appendChild(controlButton);
            this.controlButton = controlButton;

            // Control panel
            const controlPanel = document.createElement('div');
            controlPanel.style.cssText = `
                position: fixed;
                bottom: 50px;
                left: 10px;
                background: rgba(0,0,0,0.9);
                color: #fff;
                padding: 0;
                border-radius: 4px;
                z-index: 6000;
                font-family: Arial, sans-serif;
                font-size: 13px;
                width: 480px;
                border: 1px solid #333;
                box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                display: none;
            `;

            controlPanel.innerHTML = `
                <div style="padding: 15px; background: rgba(0,0,0,0.8); border-bottom: 1px solid #333; text-align: center;">
                    <img src="https://raw.githubusercontent.com/GeofsExplorer/GeoFS-Model-Importer/a9755c58e004a012085cdd9c856b2b88694bcd4e/GeoFS%20Model%20Importer%20Logo%20V1.png"
                         style="max-width: 100%; height: auto;"
                         alt="GeoFS Model Importer Logo">
                </div>
                <div style="padding: 15px;">
                    <div style="margin-bottom: 15px;">
                        <div style="margin-bottom: 8px; font-size: 12px;">Scale: <span id="scale-display" style="float: right;">1.0</span></div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input id="scale-control" type="range" min="0.1" max="5" step="0.01" value="1.0"
                                   style="flex: 1; height: 4px; background: #555; border-radius: 2px; outline: none;">
                            <input id="scale-input" type="number" min="0.1" max="5" step="0.01" value="1.0"
                                   style="width: 55px; padding: 4px 6px; border: 1px solid #555; border-radius: 3px; background: #333; color: white; font-size: 11px;">
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <div style="margin-bottom: 5px; font-size: 12px;">Select Model:</div>
                        <input id="model-file-input" type="file" accept=".gltf,.glb"
                               style="width: 100%; min-width: 100%; max-width: 100%; padding: 8px; height: 32px; border: 1px solid #555; border-radius: 4px; background: #222; color: white; font-size: 12px; box-sizing: border-box; overflow: hidden;">
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button id="place-model-btn" style="flex: 1; padding: 8px; border: none; border-radius: 3px; background: #2d5aa0; color: white; font-size: 11px; cursor: pointer;">
                            Place Here
                        </button>
                        <button id="use-as-aircraft-btn" style="flex: 1; padding: 8px; border: none; border-radius: 3px; background: #2d5aa0; color: white; font-size: 11px; cursor: pointer;">
                            Use as Aircraft
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(controlPanel);
            this.controlPanel = controlPanel;
        }

        setupEventListeners() {
            // UI dragging
            this.controlButton.addEventListener("mousedown", (e) => this.startDragging(e));
            document.addEventListener("mouseup", () => this.stopDragging());
            document.addEventListener("mousemove", (e) => this.handleDrag(e));

            // Panel visibility
            this.controlButton.addEventListener('click', (e) => this.togglePanelVisibility(e));
            document.addEventListener('click', (e) => this.handleOutsideClick(e));

            // Scale controls
            const scaleControl = document.getElementById("scale-control");
            const scaleInput = document.getElementById("scale-input");
            const scaleDisplay = document.getElementById("scale-display");

            scaleControl.addEventListener('input', () => {
                this.updateScaleValue(scaleControl.value);
            });

            scaleInput.addEventListener('input', () => {
                let value = parseFloat(scaleInput.value);
                if (isNaN(value)) value = 1.0;
                if (value < 0.1) value = 0.1;
                if (value > 5) value = 5;
                this.updateScaleValue(value);
            });

            // Action buttons
            document.getElementById("place-model-btn").onclick = () => this.place3DModel();
            document.getElementById("use-as-aircraft-btn").onclick = () => this.replaceAircraftModel();

            // Window resize
            window.addEventListener('resize', () => this.adjustPanelPosition());
        }

        convertFileToDataURL(fileData) {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.onload = () => resolve(fileReader.result);
                fileReader.onerror = reject;
                fileReader.readAsDataURL(fileData);
            });
        }

        updateScaleValue(newValue) {
            this.scaleValue = parseFloat(newValue);
            document.getElementById("scale-display").textContent = this.scaleValue.toFixed(2);
            document.getElementById("scale-control").value = this.scaleValue;
            document.getElementById("scale-input").value = this.scaleValue;

            // Update scale for all placed models
            this.placedModels.forEach(model => {
                this.adjustModelScale(model.entity, this.scaleValue);
            });
        }

        adjustModelScale(modelEntity, scale) {
            if (!modelEntity || !modelEntity.model) return;
            try {
                modelEntity.model.maximumScale = scale;
            } catch(error) {
                console.warn('Scale adjustment failed:', error);
            }
        }

        startDragging(event) {
            this.isDraggingUI = true;
            this.dragOffset.initialX = event.clientX - this.dragOffset.x;
            this.dragOffset.initialY = event.clientY - this.dragOffset.y;
            this.controlButton.style.cursor = "grabbing";
        }

        stopDragging() {
            this.isDraggingUI = false;
            this.controlButton.style.cursor = "move";
            this.adjustPanelPosition();
        }

        handleDrag(event) {
            if (!this.isDraggingUI) return;

            event.preventDefault();
            this.dragOffset.x = event.clientX - this.dragOffset.initialX;
            this.dragOffset.y = event.clientY - this.dragOffset.initialY;

            this.controlButton.style.transform = `translate3d(${this.dragOffset.x}px, ${this.dragOffset.y}px, 0)`;
        }

        togglePanelVisibility(event) {
            if (this.isDraggingUI) return;

            const shouldShow = this.controlPanel.style.display !== "block";
            this.controlPanel.style.display = shouldShow ? "block" : "none";

            if (shouldShow) {
                this.adjustPanelPosition();
            }
        }

        handleOutsideClick(event) {
            if (!this.controlPanel.contains(event.target) && event.target !== this.controlButton) {
                this.controlPanel.style.display = 'none';
            }
        }

        adjustPanelPosition() {
            if (this.controlPanel.style.display !== 'block') return;

            const buttonRect = this.controlButton.getBoundingClientRect();
            const panelRect = this.controlPanel.getBoundingClientRect();

            let panelTop = buttonRect.top - panelRect.height - 10;
            let panelLeft = buttonRect.left;

            if (panelTop < 0) {
                panelTop = buttonRect.bottom + 10;
            }

            if (panelLeft + panelRect.width > window.innerWidth) {
                panelLeft = window.innerWidth - panelRect.width - 10;
            }

            this.controlPanel.style.top = `${panelTop}px`;
            this.controlPanel.style.left = `${panelLeft}px`;
            this.controlPanel.style.bottom = 'auto';
        }

        async place3DModel() {
            const fileInput = document.getElementById("model-file-input");
            const selectedFile = fileInput.files[0];

            if (!selectedFile) {
                this.showMessage("Please select a GLTF model first");
                return;
            }

            if (!this.checkGeoFSReady()) {
                this.showMessage("Error: GeoFS API not available");
                return;
            }

            try {
                const modelDataURL = await this.convertFileToDataURL(selectedFile);
                const aircraft = window.geofs.aircraft.instance;
                const groundPosition = window.geofs.getGroundAltitude(aircraft.llaLocation).location;

                const worldPosition = window.Cesium.Cartesian3.fromDegrees(
                    groundPosition[1],
                    groundPosition[0],
                    groundPosition[2]
                );

                const modelEntity = window.geofs.api.viewer.entities.add({
                    position: worldPosition,
                    orientation: window.Cesium.Transforms.headingPitchRollQuaternion(
                        worldPosition,
                        new window.Cesium.HeadingPitchRoll(0, 0, 0)
                    ),
                    model: {
                        uri: modelDataURL,
                        maximumScale: this.scaleValue
                    }
                });

                const modelData = {
                    entity: modelEntity,
                    scale: this.scaleValue
                };
                this.placedModels.push(modelData);

                this.setupModelTracking(modelData);
                this.showMessage("Model placed successfully! Congratulations!");
                this.controlPanel.style.display = 'none';
            } catch (error) {
                this.showMessage("Error placing model: " + error.message);
            }
        }

        async replaceAircraftModel() {
            const fileInput = document.getElementById("model-file-input");
            const selectedFile = fileInput.files[0];

            if (!selectedFile) {
                this.showMessage("Please select a GLTF model first");
                return;
            }

            if (!this.checkGeoFSReady()) {
                this.showMessage("Error: GeoFS API not available yet.");
                return;
            }

            try {
                const modelDataURL = await this.convertFileToDataURL(selectedFile);
                const aircraft = window.geofs.aircraft.instance;

                const customModel = new window.geofs.api.Model(null, {
                    url: modelDataURL,
                    location: aircraft.llaLocation,
                    rotation: aircraft.htr
                });

                const updateHandler = () => {
                    try {
                        const currentAircraft = window.geofs.aircraft.instance;
                        customModel.setPositionOrientationAndScale(
                            currentAircraft.llaLocation,
                            currentAircraft.htr,
                            this.scaleValue
                        );
                        currentAircraft.setVisibility(0);
                    } catch(error) {
                        console.warn('Aircraft model update failed:', error);
                    }
                };

                window.geofs.api.viewer.scene.preRender.addEventListener(updateHandler);
                this.showMessage("Aircraft model replaced!");
                this.controlPanel.style.display = 'none';
            } catch (error) {
                this.showMessage("Error replacing aircraft: " + error.message);
            }
        }

        setupModelTracking(modelData) {
            const updateProcedure = () => {
                try {
                    const aircraft = window.geofs.aircraft.instance;
                    const position = aircraft.llaLocation;
                    const rotation = aircraft.htr || aircraft.hpr || [0, 0, 0];

                    const worldPos = window.Cesium.Cartesian3.fromDegrees(
                        position[1],
                        position[0],
                        position[2]
                    );

                    modelData.entity.position = worldPos;
                    modelData.entity.orientation = window.Cesium.Transforms.headingPitchRollQuaternion(
                        worldPos,
                        new window.Cesium.HeadingPitchRoll(rotation[0], rotation[1], rotation[2])
                    );
                    this.adjustModelScale(modelData.entity, modelData.scale);
                } catch(error) {
                    console.warn('Model tracking update failed:', error);
                }
            };

            window.geofs.api.viewer.scene.preRender.addEventListener(updateProcedure);
        }

        checkGeoFSReady() {
            return window.geofs && window.Cesium && window.geofs.api;
        }

        showMessage(text) {
            alert(text);
        }

        waitForGeoFSReady() {
            const checkReady = () => {
                if (this.checkGeoFSReady()) {
                    this.updateScaleValue(1.0);
                } else {
                    setTimeout(checkReady, 1000);
                }
            };
            checkReady();
        }
    }

    // Initialize the model importer
    new ModelImporter3D();

})();
