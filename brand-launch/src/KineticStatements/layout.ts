// Every format shows one short 2–3 word phrase at a time.
// The stage stays centered while each aspect ratio gets its own type scale.
export const kineticLayout = (width: number, height: number) => {
  if (width > height) {
    return {
      width: 1920,
      height: 1080,
      text: {
        left: 160,
        width: 1600,
        size: 160,
        centerY: 540,
        maxLines: 1,
      },
      signature: { left: 926, top: 1009, width: 68 },
    };
  }

  if (height > width) {
    return {
      width: 1080,
      height: 1920,
      text: {
        left: 74,
        width: 932,
        size: 142,
        centerY: 960,
        maxLines: 1,
      },
      signature: { left: 492, top: 1816, width: 96 },
    };
  }

  return {
    width: 1080,
    height: 1080,
    text: {
      left: 70,
      width: 940,
      size: 116,
      centerY: 540,
      maxLines: 1,
    },
    signature: { left: 506, top: 1009, width: 68 },
  };
};
