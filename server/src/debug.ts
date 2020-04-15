
const DEBUG : boolean = process.env.DEBUG ? true : false;

function debug(input: any){
    if(!DEBUG) return;
    console.log("DEBUG: ");
    console.log(input);
}




export {debug};