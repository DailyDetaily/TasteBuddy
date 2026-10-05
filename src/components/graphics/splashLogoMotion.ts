export const clampSplashProgress = (value: number) => Math.max(0, Math.min(1, value));
export const splashEase = (value: number) => {
    const t = clampSplashProgress(value);
    return t * t * (3 - 2 * t);
};

// The exact inverse-Z / local-X / perspective / Z composition from Logo-Black.
// CSS matrix3d and CATransform3D use the same flattened coefficient layout.
export function splashPetalMatrix(angle: number, fold: number, perspective: number): number[] {
    const a = angle * Math.PI / 180;
    const ca = Math.cos(a), sa = Math.sin(a), c = Math.cos(fold), s = Math.sin(fold);
    return [
        ca * ca + sa * sa * c, ca * sa * (1 - c), -sa * s, sa * s / perspective,
        ca * sa * (1 - c), sa * sa + ca * ca * c, ca * s, -ca * s / perspective,
        sa * s, -ca * s, c, -c / perspective,
        0, 0, 0, 1,
    ];
}
