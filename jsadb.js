/*
///////////////////////////////////////////////////////////////

     ██╗███████╗       █████╗ ██████╗ ██████╗ 
     ██║██╔════╝      ██╔══██╗██╔══██╗██╔══██╗
     ██║███████╗█████╗███████║██║  ██║██████╔╝
██   ██║╚════██║╚════╝██╔══██║██║  ██║██╔══██╗
╚█████╔╝███████║      ██║  ██║██████╔╝██████╔╝
 ╚════╝ ╚══════╝      ╚═╝  ╚═╝╚═════╝ ╚═════╝ 
                                            
A JavaScript android device bridge controller API!
Developed by Matheus Ibrahim (Matth33w) - 2023
///////////////////////////////////////////////////////////////
*/

const { exec } = require("child_process");
const fs = require("fs");
const readline = require("readline");

class JSADB {
    constructor() {
        this.errorHandler = this.errorHandler.bind(this);
    }

    errorHandler({code, message}) {
        return new Error(`An error occurred during execution.\nSTATUS: ${code}\n\nError Message:\n${message}`);
    }

    executeAdbCommand(command, device = '') {
        return new Promise((resolve, reject) => {
            const deviceFlag = device ? `-s ${device}` : '';
            exec(`adb ${deviceFlag} ${command}`, (error, stdout, stderr) => {
                if (error) {
                    reject(this.errorHandler(error));
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    tap(x, y, device) {
        return this.executeAdbCommand(`shell input tap ${x} ${y}`, device);
    }

    swipe(xPoint1, yPoint1, xPoint2, yPoint2, durationInMs, device) {
        return this.executeAdbCommand(`shell input swipe ${xPoint1} ${yPoint1} ${xPoint2} ${yPoint2} ${durationInMs}`, device);
    }

    type(text, device) {
        return this.executeAdbCommand(`shell input text "${text}"`, device);
    }

    screenshot(device) {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
            const filename = `${device}_${timestamp}.png`;
            this.executeAdbCommand(`shell screencap -p /sdcard/${filename} && adb pull /sdcard/${filename}`, device)
                .then(() => {
                    fs.readFile(filename, (err, data) => {
                        if (err) {
                            reject(this.errorHandler({code: -1, message: "Failed to read screenshot file"}));
                        } else {
                            const base64Image = data.toString('base64');
                            fs.unlink(filename, (err) => {
                                if (err) console.error("Failed to delete screenshot file:", err);
                            });
                            resolve(base64Image);
                        }
                    });
                })
                .catch(reject);
        });
    }

    dumpWindowXML(device) {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
            const filename = `window_dump_${device}_${timestamp}.xml`;
            this.executeAdbCommand(`shell uiautomator dump /sdcard/${filename} && adb pull /sdcard/${filename}`, device)
                .then(() => {
                    fs.readFile(filename, 'utf8', (err, data) => {
                        if (err) {
                            reject(this.errorHandler({code: -1, message: "Failed to read window dump file"}));
                        } else {
                            fs.unlink(filename, (err) => {
                                if (err) console.error("Failed to delete window dump file:", err);
                            });
                            resolve(data);
                        }
                    });
                })
                .catch(reject);
        });
    }

    existsInDump(query, prop) {
        return new Promise(async (resolve, reject) => {
            if(!fs.existsSync(__dirname + "/window_dump.xml")) {
                reject(this.errorHandler({code: -1, message: "You need to dump the XML before making a query on it."}));
            } else {
                const rl = readline.createInterface(fs.createReadStream(__dirname + "/window_dump.xml"));
                let text = "";
                
                rl.on("line", textStream => {
                    text += textStream;
                });

                rl.on("close", () => {
                    resolve(text.indexOf(prop ? `${prop}="${query}"` : `text="${query}"`) > -1 ? true : false);
                });
            }
        });
    }

    async getResolution(device) {
        const output = await this.executeAdbCommand('shell wm size', device);
        const [width, height] = output.substring(15).trim().split('x').map(Number);
        return { width, height };
    }

    async getDeviceList() {
        const output = await this.executeAdbCommand('devices');
        return output.split('\n')
            .slice(1)
            .map(line => line.split('\t')[0])
            .filter(device => device.trim() !== '');
    }

    async listOfInstalledApps(device) {
        const output = await this.executeAdbCommand('shell pm list packages', device);
        return output.replace(/\r/g, '').replace(/package:/g, '').split('\n');
    }

    appExists(appPackageName, device) {
        return new Promise(async (resolve, reject) => {
            try {
                const installedApps = await this.listOfInstalledApps(device ? device : undefined);

                if(appPackageName.trim() == "") {
                    reject(this.errorHandler({code: -1, message: "The app package name is mandatory."}));
                }

                if(installedApps.indexOf(appPackageName) > -1) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch(err) {
                reject(err);
            }
        });
    }

    clearAppCache(appPackageName, device) {
        return this.executeAdbCommand(`shell pm clear ${appPackageName}`, device);
    }

    openApp(appPackageName, device) {
        return this.executeAdbCommand(`shell monkey -p ${appPackageName} 1`, device);
    }

    installApp(appPath, device) {
        return this.executeAdbCommand(`install ${appPath}`, device);
    }

    goToHome(device) {
        return this.executeAdbCommand('shell input keyevent KEYCODE_HOME', device);
    }

    async connectDevice(device) {
        const output = await this.executeAdbCommand(`connect ${device}`);
        return output.includes('connected');
    }

    waitInMilliseconds(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    getBatteryDetails(device) {
        return new Promise((resolve, reject) => {
            exec(`adb ${device ? `-s ${device}` : ""} shell dumpsys battery`, (error, stdout, stderr) => {
                if(error) {
                    reject(this.errorHandler(error));
                } else {
                    const textLines = stdout.replace(/\r/g, "").split("\n");
                    let finalObject = {};

                    for(var i = 1; i < textLines.length; i++) {
                        if(textLines[i].trim() != "") {
                            const currentTextLine = textLines[i].replace(/\s\s/g, "");
                            const propAndValueSeparator = currentTextLine.split(":");

                            let prop = propAndValueSeparator[0];
                            let value = propAndValueSeparator[1].substring(1, propAndValueSeparator[1].length);

                            switch(prop) {
                                case "AC powered": {
                                    prop = "acPowered";
                                    break;
                                }

                                case "USB powered": {
                                    prop = "usbPowered";
                                    break;
                                }

                                case "Wireless powered": {
                                    prop = "wirelessPowered";
                                    break;
                                }

                                case "Max charging current": {
                                    prop = "maxChargingCurrent";
                                    break;
                                }

                                case "Max charging voltage": {
                                    prop = "maxChargingVoltage";
                                    break;
                                }

                                case "Charge counter": {
                                    prop = "chargeCounter";
                                    break;
                                }
                            }

                            if(!isNaN(value)) {
                                value = Number(value);
                            }

                            if(value == "true" || value == "false") {
                                value = Boolean(value);
                            }

                            finalObject[prop] = value;
                        }
                    }
                    resolve(finalObject);
                }
            });
        });
    }

    async serviceCheck(service, device) {
        const output = await this.executeAdbCommand(`shell service check ${service}`, device);
        return !output.includes('not found');
    }

    findNearestNodeAtCoordinates(x, y, xmlData) {
        const boundsRegex = /bounds="(\[(\d+),(\d+)\]\[(\d+),(\d+)\])"/;
        const lines = xmlData.split('\n');
        let nearestNode = null;
        let smallestArea = Infinity;

        for (let line of lines) {
            const match = line.match(boundsRegex);
            if (match) {
                const [, , left, top, right, bottom] = match.map(Number);
                if (x >= left && x <= right && y >= top && y <= bottom) {
                    const area = (right - left) * (bottom - top);
                    if (area < smallestArea) {
                        smallestArea = area;
                        // Extract all attributes using regex
                        const attributes = {};
                        const attrRegex = /(\S+)="([^"]*)"/g;
                        let attrMatch;
                        while ((attrMatch = attrRegex.exec(line)) !== null) {
                            attributes[attrMatch[1]] = attrMatch[2];
                        }
                        nearestNode = attributes;
                    }
                }
            }
        }

        return nearestNode;
    }

    async findNearestNodeAtCoordinatesFromDump(x, y, device) {
        const xmlData = await this.dumpWindowXML(device);
        return this.findNearestNodeAtCoordinates(x, y, xmlData);
    }
}

module.exports = JSADB;