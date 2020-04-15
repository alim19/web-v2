import * as express from "express"
import {debug} from "./debug";


function AutoRedirect(req : express.Request, res : express.Response, next : express.NextFunction){

    //get last character of req string.
    let lastchar : string = req.path.substr(req.path.length-1, 1);
    debug(`Last character: '${lastchar}' : ${req.path}`);

    if(lastchar == '/'){
        res.redirect(req.path + "index.html");
        res.end();
    // }else if(req.path.lastIndexOf('.') < req.path.lastIndexOf('/')){
    //     res.redirect(req.path + ".html");
    //     res.end();
    }else
        next();
}

export {AutoRedirect};