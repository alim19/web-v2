import * as express from "express";
import {
    sendFile,
    GlobalRoot
} from "./sendFile";
// import * as fs from "fs";



function _404(req: express.Request, res: express.Response, next: express.NextFunction) {

    res.status(404);
    if (req.path.substr(req.path.lastIndexOf('.')) != ".html") {
        res.end();

    } else {
        sendFile(GlobalRoot + "/errors/404.html", req, res, next);
        // next();
    }
}

function error(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {

    if (typeof (err) == 'string') {
        res.status(parseInt(err));
    } else if (typeof (err) == 'number') {
        res.status(err);
    }

    sendFile(`${GlobalRoot}/errors/${err}.html`, req, res, next);



    // next();

}

function handled_error(err: express.Errback, req: express.Request, res: express.Response, next: express.NextFunction) {

    res.status(500);
    sendFile(`${GlobalRoot}/errors/500.html`, req, res, next);
    console.log("SERVER ERROR")
    console.log(err);
    // next();
}

function unhandled_error(err: express.Errback, req: express.Request, res: express.Response, next: express.NextFunction) {

    res.status(500);
    res.send("Serious unexpected server issue. This will be resolved as soon as possible. please bear with.");
    res.end();

}



export {
    _404,
    error,
    handled_error,
    unhandled_error
};