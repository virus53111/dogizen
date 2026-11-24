import { db } from 'hatchable';
import { profileCommunity } from '../render/profile-community.js';
export const access='public';
export const methods=['GET','POST'];
export default profileCommunity(db);
