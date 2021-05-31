// https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas/21961894
function fit(contains) {
    return (parentWidth, parentHeight, childWidth, childHeight, scale = 1, offsetX = 0, offsetY = 0) => {
      const childRatio = childWidth / childHeight;
      const parentRatio = parentWidth / parentHeight;
      let width = parentWidth * scale;
      let height = parentHeight * scale;
  
      if (contains ? (childRatio > parentRatio) : (childRatio < parentRatio)) {
        height = width / childRatio;
      } else {
        width = height * childRatio;
      }
  
      return {
        width,
        height,
        offsetX: (parentWidth - width) * offsetX,
        offsetY: (parentHeight - height) * offsetY
      };
    }
  }
  
  export const imageContainParams = fit(true);
  export const imageCoverParams = fit(false);
  