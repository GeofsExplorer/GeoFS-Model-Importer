// ==UserScript==
// @name         GeoFS Model Importer
// @namespace    https://github.com/GeofsExplorer/GeoFS-Model-Importer/
// @version      Alpha v0.1
// @description  GLTF Model placer for GeoFS (1:1 scale default, matches aircraft heading)
// @author       GeofsExplorer and 31124呀
// @match        https://www.geo-fs.com/geofs.php?v=3.9
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
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

    const ui = document.createElement('div');
    ui.style.cssText = `
        position: fixed;
        right: 10px;
        top: 12vh;
        background: rgba(0,0,0,0.55);
        color: #fff;
        padding: 10px;
        border-radius: 8px;
        z-index: 6000;
        font-family: Arial, sans-serif;
        font-size: 13px;
        width: 180px;
    `;
    ui.innerHTML = `
        <button id="sp-toggle" style="width:100%;padding:5px;border-radius:6px;cursor:pointer;margin-bottom:8px;">GeoFS Model Importer</button>
        <div id="sp-body" style="display:none;">
            <input id="sp-file" type="file" accept=".gltf,.glb" style="width:100%;margin-bottom:8px;">
            <label style="display:block;margin-bottom:6px;">
                Scale
                <input id="sp-scale" type="range" min="0.1" max="5" step="0.01" value="1.0" style="width:100%;">
            </label>
            <button id="sp-place" style="width:100%;padding:6px;border-radius:6px;cursor:pointer;margin-bottom:6px;">Place Here</button>
            <button id="sp-ac" style="width:100%;padding:6px;border-radius:6px;cursor:pointer;">Use as Aircraft</button>
        </div>
    `;
    document.body.appendChild(ui);

    const body = document.getElementById("sp-body");
    document.getElementById("sp-toggle").onclick = () => {
        body.style.display = body.style.display === "none" ? "block" : "none";
    };

    const fileInput = document.getElementById("sp-file");
    const scaleRange = document.getElementById("sp-scale");
    const placed = [];

    async function placeModel(file) {
        if (!window.geofs || !window.Cesium || !window.geofs.api) return;

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
    }

    async function useAsAircraft(file) {
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
    }

    document.getElementById("sp-place").onclick = async () => {
        const f = fileInput.files[0];
        if (!f) return alert("Choose a GLTF model first");
        await placeModel(f);
    };

    document.getElementById("sp-ac").onclick = async () => {
        const f = fileInput.files[0];
        if (!f) return alert("Choose a GLTF model first");
        await useAsAircraft(f);
    };

})();
