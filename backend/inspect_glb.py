import json
import struct

def parse_glb(file_path):
    with open(file_path, 'rb') as f:
        magic = f.read(4)
        if magic != b'glTF':
            print(f"{file_path} is not a valid GLB")
            return
        
        version = struct.unpack('<I', f.read(4))[0]
        length = struct.unpack('<I', f.read(4))[0]
        
        chunk0_length = struct.unpack('<I', f.read(4))[0]
        chunk0_type = f.read(4)
        
        if chunk0_type != b'JSON':
            print("First chunk is not JSON")
            return
            
        json_data = f.read(chunk0_length).decode('utf-8')
        gltf = json.loads(json_data)
        
        print(f"--- {file_path} ---")
        if 'meshes' in gltf:
            print(f"Meshes ({len(gltf['meshes'])}):")
            for i, mesh in enumerate(gltf['meshes']):
                name = mesh.get('name', 'Unnamed')
                print(f"  [{i}] {name}")
                
        if 'materials' in gltf:
            print(f"Materials ({len(gltf['materials'])}):")
            for i, mat in enumerate(gltf['materials']):
                name = mat.get('name', 'Unnamed')
                print(f"  [{i}] {name}")
                
        if 'skins' in gltf:
            print(f"Skins (Rigging): {len(gltf['skins'])} found")
        else:
            print("Skins (Rigging): None found")

parse_glb('../frontend/public/models/maleAvatar.glb')
parse_glb('../frontend/public/models/femaleAvatar.glb')
