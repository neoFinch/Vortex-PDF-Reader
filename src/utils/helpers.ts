export const checkIfEmbeddingModel = (modelName: string) => {
  if ( modelName.includes('embed') || modelName.includes('embedding') ) {
    return true;
  } else {
    return false;
  }
}