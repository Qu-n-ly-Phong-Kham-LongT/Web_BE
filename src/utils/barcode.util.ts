import bwipjs from 'bwip-js';

export const generateBarcodeBuffer = async (text: string): Promise<Buffer> => {
  return await bwipjs.toBuffer({
    bcid: 'code128',       
    text: text,            
    scale: 3,             
    height: 10,
  });
};