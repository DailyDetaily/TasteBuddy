import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const fontReady = Promise.all([
  loadFont({family: 'Pretendard', url: staticFile('fonts/Pretendard-Regular.otf'), weight: '400'}),
  loadFont({family: 'Pretendard', url: staticFile('fonts/Pretendard-Medium.otf'), weight: '500'}),
  loadFont({family: 'Pretendard', url: staticFile('fonts/Pretendard-SemiBold.otf'), weight: '600'}),
  loadFont({family: 'Pretendard', url: staticFile('fonts/Pretendard-Bold.otf'), weight: '700'}),
]);
