import {db} from 'hatchable';
import {recordTraffic} from '../render/traffic.js';
export const access='public';
export const methods=['POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','no-store');
 try{await recordTraffic(db,req)}catch{ /* Statistics must never block the site or log visitor data. */ }
 return res.status(204).end()
}
