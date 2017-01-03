import * as request from 'request';
import * as http from 'http';
import * as cheerio from 'cheerio';
import * as colors from 'colors';
const leftpad = require('left-pad');

class Plane {
    constructor(
        public flightNumber: string,
        public aircraftModel: string,
        public origin: string,
        public estimatedArrivalTime: string) {}
}

function getPlanes(offset: number, callback: (planes: Plane[]) => void) {
    const address = `http://flightaware.com/live/airport/CYUL/enroute?;offset=${offset};order=estimatedarrivaltime;sort=ASC`;

    console.log('Fetching ' + address);

    request.get(address, (error: any, response: http.IncomingMessage, body: any) => {
        if (error) {
            console.log('Error: ' + error);
            return;
        }

        if (response.statusCode != 200) {
            console.log('Error, status code: ' + response.statusCode);
            return;
        }

        let planes : Plane[] = [];
        let $ = cheerio.load(body);
        $('.prettyTable tr').each((index: number, element: CheerioElement) => {
            if (element.children[0].tagName == 'th')
                return;

            let getThing = function (idx: number) {
                return $(element.children[idx]).find('a').text();
            }

            let getOtherThing = function (idx: number) {
                return $(element.children[idx]).text();
            }

            let flightNumber = getThing(0);
            let aircraftModel = getThing(1);
            let origin = getThing(2);
            let estimatedArrivalTime = getOtherThing(5);

            planes.push(new Plane(flightNumber, aircraftModel, origin, estimatedArrivalTime));
        });

        callback(planes);
    });
}

function getAllPlanes(callback: (planes: Plane[]) => void) {
    const nbPlanes = 40;
    let offset = 0;
    let allPlanes : Plane[] = [];

    console.log('Getting ' + nbPlanes + ' planes.');

    let newPlanes = function (planes: Plane[]) {
        allPlanes = allPlanes.concat(planes);

        offset += 20;

        if (offset >= nbPlanes) {
            /* We are done, call the callback. */
            callback(allPlanes);
        } else {
            /* We are not done, get more planes. */
            getPlanes(offset, newPlanes);
        }
    }

    getPlanes(offset, newPlanes);
}

/* Colorize the aircraft name based on its size. */
function colorizeAircraft(aircraft: string) {
    /* The type of the aircraft can be guessed with the first 3 letters. */
    const subAircraft = aircraft.substr(0, 3);

    let colorizer = null;

    switch (subAircraft) {
        /* medium */
        case 'A31':
        case 'A32':
            colorizer = colors.yellow;
            break;

        /* small */
        case 'CRJ':
        case 'E14':
        case 'DH8':
        case 'E19':
        case 'E45':
        case 'E17':
        case 'B71':
        case 'CL6':
        case 'BE1':
        case 'E50':
            colorizer = colors.red;
            break;

        /* large */
        case 'A33':
        case 'B73':
        case 'B76':
        case 'B77':
            colorizer = colors.green;
            break;
    }

    /* Make sure they are all 4 chars wide. */
    aircraft = leftpad(aircraft, 4);

    if (colorizer) {
        aircraft = colorizer(aircraft);
    }

    return aircraft;
}

function printPlane(plane: Plane) {
    let ac = colorizeAircraft(plane.aircraftModel);
    console.log(`${plane.estimatedArrivalTime} - ${ac} - ${plane.flightNumber} - ${plane.origin}`);
}

getAllPlanes((planes: Plane[]) => {
    planes.forEach(printPlane);
});
