(()=>{const form=document.getElementById('form'),preview=document.getElementById('photoPreview');if(!form||!preview)return;let urls=[];
function clear(){for(const url of urls)URL.revokeObjectURL(url);urls=[];preview.replaceChildren()}
window.mmClearStoryPreview=clear;
function render(){clear();const cover=[...form.elements.cover.files],photos=[...form.elements.photos.files];
 if(photos.length>5||[...cover,...photos].some(f=>f.size>4194304||!['image/jpeg','image/png','image/webp'].includes(f.type))){preview.textContent='Выберите до пяти фото JPG, PNG или WebP, до 4 МБ каждое.';return}
 for(const f of [...cover,...photos]){const u=URL.createObjectURL(f);urls.push(u);const img=document.createElement('img');img.src=u;img.alt='Предварительный просмотр';preview.append(img)}
}
form.elements.cover.addEventListener('change',render);form.elements.photos.addEventListener('change',render);window.addEventListener('pagehide',clear);
})();
