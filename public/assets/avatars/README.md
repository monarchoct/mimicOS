# Avatar Models Directory

This directory is for storing 3D avatar models that can be used in the AI Companion Launchpad.

## Supported Formats

1. **GLTF/GLB** - Standard 3D format
2. **VRM** - VRoid/VTuber avatar format
3. **FBX** - Requires conversion to GLTF

## How to Add Models

### Ready Player Me
1. Go to https://readyplayer.me
2. Create your avatar
3. Copy the .glb URL
4. Use the URL directly in the companion creation form

### Custom Models
1. Place your .glb or .gltf files in this directory
2. Use the path `/assets/avatars/your-model.glb` in the companion creation

### VRM Models
1. Download VRM models from:
   - https://hub.vroid.com
   - Create with VRoid Studio
2. Place .vrm files in this directory
3. Use the path `/assets/avatars/your-model.vrm`

### Mixamo Characters
1. Download from https://mixamo.com
2. Export as FBX or GLTF
3. Place in this directory
4. For animations, place them in `/assets/animations/`

## Model Requirements

- **File Size**: Keep under 50MB for optimal loading
- **Textures**: Embedded or in same directory
- **Animations**: Can be included in model or loaded separately
- **Scale**: Models are auto-scaled to fit the view

## Example Models

You can download free models from:
- [Sketchfab](https://sketchfab.com/search?q=character&type=models&features=downloadable)
- [Ready Player Me](https://readyplayer.me)
- [VRoid Hub](https://hub.vroid.com)
- [Mixamo](https://mixamo.com)

## Optimization Tips

1. Use DRACO compression for smaller file sizes
2. Reduce texture sizes for web use
3. Limit polygon count to under 50k for best performance
4. Use GLB format for embedded textures