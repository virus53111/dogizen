export async function sendVerificationWithFallback(send,user,settings){
 try{return await send(user,settings)}catch(error){
  if(!["auth/unauthorized-continue-uri","auth/invalid-continue-uri","auth/missing-continue-uri"].includes(error?.code))throw error;
  return send(user);
 }
}
export async function verifiedToken(user){await user.reload();return user.emailVerified===true?user.getIdToken(true):null;}

// An existing account can only be recovered by authenticating with its password.
export async function registerOrSignIn(create,signIn,auth,email,password){
 try{return await create(auth,email,password)}catch(error){
  if(error?.code!=="auth/email-already-in-use")throw error;
  return signIn(auth,email,password);
 }
}
export async function sendResetWithFallback(send,auth,email,settings){
 try{return await send(auth,email,settings)}catch(error){
  if(!["auth/unauthorized-continue-uri","auth/invalid-continue-uri","auth/missing-continue-uri"].includes(error?.code))throw error;
  return send(auth,email);
 }
}
