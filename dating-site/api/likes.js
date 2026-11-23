import { db } from 'hatchable';
export const access='user';
export const methods=['GET','POST'];
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export default async function(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 const current=req.user?.id;
 if(!current||req.user?.verified!==true)
   return res.status(403).json({error:'Подтвердите email и войдите в аккаунт'});
 if(req.method==='GET'){
  // Return only the caller's own likes and mutually agreed matches.
  // Never expose who has liked the caller before a reciprocal match.
  const found=await db.query(`
   SELECT l.id,l.display_name,l.age,l.city,l.country,l.category,l.avatar_url,
          l.headline, f.created_at,
          EXISTS (
            SELECT 1 FROM mm_member_likes reciprocal
            JOIN mm_listings mine ON mine.id=reciprocal.listing_id
            WHERE reciprocal.liker_id=l.owner_id
              AND reciprocal.liked_owner_id=$1
              AND mine.owner_id=$1 AND mine.status='approved'
          ) AS matched
     FROM mm_member_likes f
     JOIN mm_listings l ON l.id=f.listing_id
       AND l.owner_id=f.liked_owner_id
    WHERE f.liker_id=$1 AND l.status='approved'
      AND NOT EXISTS (
        SELECT 1 FROM mm_conversations c
        WHERE c.blocked_by IS NOT NULL
          AND ((c.requester_id=$1 AND c.publisher_id=l.owner_id)
           OR (c.publisher_id=$1 AND c.requester_id=l.owner_id))
      )
    ORDER BY f.created_at DESC LIMIT 100
  `,[current]);
  const sanitized=found.rows.map(({matched,...profile})=>({...profile,matched:matched===true}));
  return res.json({
    liked_ids:sanitized.map(x=>x.id),
    matches:sanitized.filter(x=>x.matched)
  });
 }
 const id=String(req.body?.listing_id||'');
 const action=String(req.body?.action||'');
 if(!UUID.test(id)||!['add','remove'].includes(action))
   return res.status(400).json({error:'Укажите анкету и действие'});
 if(action==='remove'){
  await db.query('DELETE FROM mm_member_likes WHERE liker_id=$1 AND listing_id=$2',[current,id]);
  return res.json({ok:true,liked:false,matched:false});
 }
 // No self-liking, no unpublished/admin/archived profiles, no blocked contacts,
 // max 100 active likes per member to limit automated mass-marking.
 const inserted=await db.query(`
   INSERT INTO mm_member_likes(liker_id,liked_owner_id,listing_id)
   SELECT $1,l.owner_id,l.id FROM mm_listings l
    WHERE l.id=$2 AND l.status='approved' AND l.owner_id<>$1
      AND NOT EXISTS(
        SELECT 1 FROM mm_conversations c
        WHERE c.blocked_by IS NOT NULL
          AND ((c.requester_id=$1 AND c.publisher_id=l.owner_id)
           OR (c.publisher_id=$1 AND c.requester_id=l.owner_id))
      )
      AND (SELECT COUNT(*) FROM mm_member_likes WHERE liker_id=$1)<100
   ON CONFLICT(liker_id,liked_owner_id)
   DO UPDATE SET listing_id=EXCLUDED.listing_id
   RETURNING liked_owner_id
 `,[current,id]);
 if(!inserted.rows.length)
   return res.status(404).json({error:'Анкета недоступна для симпатий либо достигнут лимит'});
 const target=inserted.rows[0].liked_owner_id;
 const mutual=await db.query(`
    SELECT EXISTS (
      SELECT 1 FROM mm_member_likes reciprocal
      JOIN mm_listings mine ON mine.id=reciprocal.listing_id
      WHERE reciprocal.liker_id=$2
        AND reciprocal.liked_owner_id=$1
        AND mine.owner_id=$1 AND mine.status='approved'
    ) AS matched
 `,[current,target]);
 return res.json({ok:true,liked:true,matched:mutual.rows[0]?.matched===true});
}
