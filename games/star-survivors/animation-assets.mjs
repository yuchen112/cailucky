const pending = new WeakMap();

export async function loadAnimationManifest(images) {
  if (images.animations) return images.animations;
  const response = await fetch('art/v5/animations.json?v=5');
  if (!response.ok) throw new Error('無法載入動作資料');
  const manifest = await response.json();
  if (manifest.version !== 5) throw new Error('動作資料版本不符');
  images.animations = { manifest, roles: {}, monsters: {} };
  pending.set(images, new Map());
  return images.animations;
}

async function ensureActor(images, kind, id) {
  const animations = images.animations;
  if (!animations) throw new Error('動作資料尚未載入');
  if (animations[kind][id]) return animations[kind][id];
  const key = `${kind}:${id}`;
  const loading = pending.get(images);
  if (loading.has(key)) return loading.get(key);
  const spec = animations.manifest[kind][id];
  if (!spec) throw new Error(`缺少動作 ${id}`);
  const task = Promise.all(Object.entries(spec.states).map(async ([state, files]) => {
    const frames = await Promise.all(files.map(file => new Promise((resolve, reject) => {
      const frame = new Image();
      frame.onload = () => resolve(frame);
      frame.onerror = () => reject(new Error(`無法載入動作 ${file}`));
      frame.src = file;
    })));
    return [state, frames];
  })).then(states => animations[kind][id] = { ...spec, states: Object.fromEntries(states) })
    .finally(() => loading.delete(key));
  loading.set(key, task);
  return task;
}

export const ensureRoleAnimation = (images, id) => ensureActor(images, 'roles', id);
export const ensureMonsterAnimation = (images, id) => ensureActor(images, 'monsters', id);

export async function ensureMapAnimations(images, mapId) {
  const ids = images.animations?.manifest.maps[mapId];
  if (!ids) throw new Error('無法載入此地圖的敵人');
  return Promise.all(ids.map(id => ensureMonsterAnimation(images, id)));
}

export function actorFrame(images, kind, id, state, progress = 0, loop = false) {
  const actor = images.animations?.[kind]?.[id];
  const frames = actor?.states[state] || actor?.states.idle;
  if (!frames?.length) return null;
  const index = Math.max(0, Math.floor(progress * frames.length));
  return frames[loop ? index % frames.length : Math.min(index, frames.length - 1)];
}
