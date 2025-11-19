// ==UserScript==
// @name         GeoFS Model Importer
// @name:zh-CN   GeoFS 模型导入器
// @name:zh-TW   GeoFS 模型匯入器
// @description  GLTF Model placer for GeoFS (1:1 scale default, matches aircraft heading)
// @description:zh-CN  GeoFS 的 GLTF 模型导入工具
// @description:zh-TW  GeoFS 的 GLTF 模型匯入工具
// @namespace    https://github.com/GeofsExplorer/GeoFS-Model-Importer
// @version      1.0.0
// @description  GLTF Model placer for GeoFS (1:1 scale default, matches aircraft heading)
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

    const toDataUrl = (file) => new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });

    function setEntityScale(ent, s) {
        if (!ent) return;
        try { ent.model.maximumScale = s; } catch(e){}
    }

    const button = document.createElement('div');
    button.style.cssText = `
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
    button.innerHTML = 'Model Importer';
    document.body.appendChild(button);

    const panel = document.createElement('div');
    panel.style.cssText = `
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

    panel.innerHTML = `
        <div style="padding: 15px; background: rgba(0,0,0,0.8); border-bottom: 1px solid #333; text-align: center;">
            <img src="https://raw.githubusercontent.com/GeofsExplorer/GeoFS-Model-Importer/a9755c58e004a012085cdd9c856b2b88694bcd4e/GeoFS%20Model%20Importer%20Logo%20V1.png"
                 style="max-width: 100%; height: auto;"
                 alt="GeoFS Model Importer Logo">
        </div>
        <div style="padding: 15px;">
            <div style="margin-bottom: 15px;">
                <div style="margin-bottom: 8px; font-size: 12px;">Scale: <span id="scale-value" style="float: right;">1.0</span></div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input id="sp-scale" type="range" min="0.1" max="5" step="0.01" value="1.0"
                           style="flex: 1; height: 4px; background: #555; border-radius: 2px; outline: none;">
                    <input id="sp-scale-input" type="number" min="0.1" max="5" step="0.01" value="1.0"
                           style="width: 55px; padding: 4px 6px; border: 1px solid #555; border-radius: 3px; background: #333; color: white; font-size: 11px;">
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <div style="margin-bottom: 5px; font-size: 12px;">Select Model:</div>
                <input id="sp-file" type="file" accept=".gltf,.glb"
       style="
            width: 100%;
            min-width: 100%;
            max-width: 100%;
            padding: 8px;
            height: 32px;
            border: 1px solid #555;
            border-radius: 4px;
            background: #222;
            color: white;
            font-size: 12px;
            box-sizing: border-box;
            overflow: hidden;
        ">

            </div>

            <div style="display: flex; gap: 8px;">
                <button id="sp-place" style="flex: 1; padding: 8px; border: none; border-radius: 3px; background: #2d5aa0; color: white; font-size: 11px; cursor: pointer;">
                    Place Here
                </button>
                <button id="sp-ac" style="flex: 1; padding: 8px; border: none; border-radius: 3px; background: #2d5aa0; color: white; font-size: 11px; cursor: pointer;">
                    Use as Aircraft
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    const fileInput = document.getElementById("sp-file");
    const scaleRange = document.getElementById("sp-scale");
    const scaleInput = document.getElementById("sp-scale-input");
    const scaleValue = document.getElementById("scale-value");
    const placed = [];

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    button.addEventListener("mousedown", dragStart);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("mousemove", drag);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === button) {
            isDragging = true;
            button.style.cursor = "grabbing";
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;

        isDragging = false;
        button.style.cursor = "move";

        updatePanelPosition();
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, button);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
    }

    function updatePanelPosition() {
        if (panel.style.display === 'block') {
            const buttonRect = button.getBoundingClientRect();
            const panelRect = panel.getBoundingClientRect();

            let panelTop = buttonRect.top - panelRect.height - 10;
            let panelLeft = buttonRect.left;

            if (panelTop < 0) {
                panelTop = buttonRect.bottom + 10;
            }

            if (panelLeft + panelRect.width > window.innerWidth) {
                panelLeft = window.innerWidth - panelRect.width - 10;
            }

            panel.style.top = `${panelTop}px`;
            panel.style.left = `${panelLeft}px`;
            panel.style.bottom = 'auto';
        }
    }

    button.addEventListener('click', (e) => {
        if (!isDragging) {
            const wasVisible = panel.style.display === "block";
            panel.style.display = wasVisible ? "none" : "block";

            if (!wasVisible) {
                updatePanelPosition();
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== button) {
            panel.style.display = 'none';
        }
    });

    function updateScale(value) {
        scaleValue.textContent = parseFloat(value).toFixed(2);
        scaleRange.value = value;
        scaleInput.value = value;
    }

    scaleRange.addEventListener('input', () => {
        updateScale(scaleRange.value);
    });

    scaleInput.addEventListener('input', () => {
        let value = parseFloat(scaleInput.value);
        if (isNaN(value)) value = 1.0;
        if (value < 0.1) value = 0.1;
        if (value > 5) value = 5;
        updateScale(value);
    });

    async function placeModel(file) {
        if (!window.geofs || !window.Cesium || !window.geofs.api) {
            alert("Error: GeoFS API not available");
            return;
        }

        try {
            const data = await toDataUrl(file);
            const ac = window.geofs.aircraft.instance;
            const lla = window.geofs.getGroundAltitude(ac.llaLocation).location;
            const pos = window.Cesium.Cartesian3.fromDegrees(lla[1], lla[0], lla[2]);

            const ent = window.geofs.api.viewer.entities.add({
                position: pos,
                orientation: window.Cesium.Transforms.headingPitchRollQuaternion(
                    pos,
                    new window.Cesium.HeadingPitchRoll(0, 0, 0)
                ),
                model: { uri: data, maximumScale: 1 }
            });

            const obj = {
                ent,
                scale: parseFloat(scaleRange.value)
            };
            setEntityScale(ent, obj.scale);

            placed.push(obj);

            window.geofs.api.viewer.scene.preRender.addEventListener(() => {
                try {
                    const ac = window.geofs.aircraft.instance;
                    const lla = ac.llaLocation;
                    const hpr = ac.htr || ac.hpr || [0,0,0];

                    const p = window.Cesium.Cartesian3.fromDegrees(lla[1], lla[0], lla[2]);
                    obj.ent.position = p;
                    obj.ent.orientation = window.Cesium.Transforms.headingPitchRollQuaternion(
                        p,
                        new window.Cesium.HeadingPitchRoll(hpr[0], hpr[1], hpr[2])
                    );
                    setEntityScale(obj.ent, obj.scale);
                } catch(e){}
            });

            alert("Model placed successfully! Congratulations!");
            panel.style.display = 'none';
        } catch (error) {
            alert("Error placing model: " + error.message);
        }
    }

    async function useAsAircraft(file) {
        if (!window.geofs || !window.geofs.api) {
            alert("Error: GeoFS API not available yet.");
            return;
        }

        try {
            const ac = window.geofs.aircraft.instance;
            const data = await toDataUrl(file);

            const m = new window.geofs.api.Model(null, {
                url: data,
                location: ac.llaLocation,
                rotation: ac.htr
            });

            window.geofs.api.viewer.scene.preRender.addEventListener(() => {
                try {
                    const ac = window.geofs.aircraft.instance;
                    m.setPositionOrientationAndScale(ac.llaLocation, ac.htr, parseFloat(scaleRange.value));
                    ac.setVisibility(0);
                } catch(e){}
            });

            alert("Aircraft model replaced!");
            panel.style.display = 'none';
        } catch (error) {
            alert("Error replacing aircraft: " + error.message);
        }
    }

    document.getElementById("sp-place").onclick = async () => {
        const f = fileInput.files[0];
        if (!f) {
            alert("Please select a GLTF model first");
            return;
        }
        await placeModel(f);
    };

    document.getElementById("sp-ac").onclick = async () => {
        const f = fileInput.files[0];
        if (!f) {
            alert("Please select a GLTF model first");
            return;
        }
        await useAsAircraft(f);
    };

    updateScale(1.0);

    window.addEventListener('resize', updatePanelPosition);

})();
