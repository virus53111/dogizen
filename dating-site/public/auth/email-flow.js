export async function sendVerificationWithFallback(send,user,settings){
 try{return await send(user,settings)}catch(error){
  if(!["auth/unauthorized-continue-uri","auth/invalid-continue-uri","auth/missing-continue-uri"].includes(error?.code))throw error;
  return send(user);
 }
}
export async function verifiedToken(user){await user.reload();return user.emailVerified===true?user.getIdToken(true):null;}
