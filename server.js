const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const JSADB = require('./jsadb');
const jsadb = new JSADB();

const app = express();
const PORT = 7173;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route to execute terminal commands
app.get('/run-command', (req, res) => {
    const { command } = req.query;
    if (!command) return res.status(400).send('No command provided');

    // Execute the command
    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`Error: ${stderr}`);
        }
        res.status(200).send(`${stdout}`);
    });
});

// New route to get device list
app.get('/get-device-list', async (req, res) => {
    try {
        const devices = await jsadb.getDeviceList();
        res.status(200).json(devices);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

// New routes for JSADB functions

// Tap
app.get('/tap', async (req, res) => {
    const { x, y, device } = req.query;
    try {
        const result = await jsadb.tap(x, y, device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Swipe
app.get('/swipe', async (req, res) => {
    const { xPoint1, yPoint1, xPoint2, yPoint2, durationInMs, device } = req.query;
    try {
        const result = await jsadb.swipe(xPoint1, yPoint1, xPoint2, yPoint2, durationInMs, device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Type
app.get('/type', async (req, res) => {
    const { text, device } = req.query;
    try {
        await jsadb.type(text, device);
        res.status(200).json({ success: true, result: 'Text typed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Screenshot
app.get('/screenshot', async (req, res) => {
    const { device } = req.query;
    try {
        const result = await jsadb.screenshot(device);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Dump Window XML
app.get('/dump-window-xml', async (req, res) => {
    const { device } = req.query;
    try {
        const result = await jsadb.dumpWindowXML(device);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Exists In Dump
app.get('/exists-in-dump', async (req, res) => {
    const { query, prop } = req.query;
    try {
        const result = await jsadb.existsInDump(query, prop);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Resolution
app.get('/get-resolution', async (req, res) => {
    const { device } = req.query;
    try {
        const result = await jsadb.getResolution(device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// List of Installed Apps
app.get('/list-installed-apps', async (req, res) => {
    const { device, includeSystemApps } = req.query;
    try {
        const result = await jsadb.listOfInstalledApps(device, includeSystemApps === 'true');
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// App Exists
app.get('/app-exists', async (req, res) => {
    const { appPackageName, device } = req.query;
    try {
        const result = await jsadb.appExists(appPackageName, device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Clear App Cache
app.get('/clear-app-cache', async (req, res) => {
    const { appPackageName, device } = req.query;
    try {
        const result = await jsadb.clearAppCache(appPackageName, device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Open App
app.get('/open-app', async (req, res) => {
    const { appPackageName, device } = req.query;
    try {
        const result = await jsadb.openApp(appPackageName, device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Install App
app.get('/install-app', async (req, res) => {
    const { appPath, device } = req.query;
    try {
        const result = await jsadb.installApp(appPath, device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Go To Home
app.get('/go-to-home', async (req, res) => {
    const { device } = req.query;
    try {
        const result = await jsadb.goToHome(device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Connect Device
app.get('/connect-device', async (req, res) => {
    const { device } = req.query;
    try {
        const result = await jsadb.connectDevice(device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Wait In Milliseconds
app.get('/wait', async (req, res) => {
    const { time } = req.query;
    try {
        await jsadb.waitInMilliseconds(parseInt(time));
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Battery Details
app.get('/battery-details', async (req, res) => {
    const { device } = req.query;
    try {
        const result = await jsadb.getBatteryDetails(device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Service Check
app.get('/service-check', async (req, res) => {
    const { service, device } = req.query;
    try {
        const result = await jsadb.serviceCheck(service, device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Find Nearest Node
app.get('/find-nearest-node', async (req, res) => {
    const { x, y, device } = req.query;
    try {
        const result = await jsadb.findNodeAtCoordinateFromDump(parseInt(x), parseInt(y), device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Find Node by XPath
app.get('/find-node-by-xpath', async (req, res) => {
    const { xpath, device } = req.query;
    try {
        const result = await jsadb.findNodeByXPath(xpath, device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Current Input Text
app.get('/get-current-input-text', async (req, res) => {
    const { device } = req.query;
    try {
        const result = await jsadb.getCurrentInputText(device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Clear Current Input
app.get('/clear-current-input', async (req, res) => {
    const { device, currentText } = req.query;
    try {
        const result = await jsadb.clearCurrentInput(device, currentText);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Keep Screen On
app.get('/screen-awake', async (req, res) => {
    const { device, isOn } = req.query;
    try {
        let result;
        if (isOn === 'true') {
            result = await jsadb.screenAwake(device);
        } else {
            result = await jsadb.screenAwakeOff(device);
        }
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Turn Off Screen Stay On
app.get('/turn-off-screen-stay-on', async (req, res) => {
    const { device } = req.query;
    try {
        const result = await jsadb.turnOffScreenStayOn(device);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
