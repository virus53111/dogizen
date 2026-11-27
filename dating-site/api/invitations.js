import {db} from 'hatchable';
import {invitationCode} from '../render/invitations.js';
export const access='user';
export const methods=['POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');
 if(!req.user?.id)return res.status(401).json({error:'sign_in'});
 return res.json({code:await invitationCode(db,req.user.id)});
}
