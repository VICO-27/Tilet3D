import json, struct

def parse_glb(file_path):
    with open(file_path, 'rb') as f:
        f.read(12)
        chunk0_length = struct.unpack('<I', f.read(4))[0]
        f.read(4)
        gltf = json.loads(f.read(chunk0_length).decode('utf-8'))
        
        print(f"--- {file_path} ---")
        print(f"Skins: {len(gltf.get('skins', []))}")
        print(f"Animations: {len(gltf.get('animations', []))}")
        if 'animations' in gltf:
            for i, anim in enumerate(gltf['animations']):
                print(f"  Anim [{i}]: {anim.get('name', 'Unnamed')}")

parse_glb('../frontend/public/models/maleAvatar.glb')
parse_glb('../frontend/public/models/femaleAvatar.glb')
