
export function getSummaryPrompt(title: string, transcript: string, byteLimit: number) {
  const truncatedTranscript = limitTranscriptByteLength(transcript, byteLimit);
  return `标题: "${title.replace(/\n+/g, " ").trim()}"\n字幕: "${truncatedTranscript.replace(/\n+/g, " ").trim()}"\n中文总结:`;
}

export function limitTranscriptByteLength(str: string, byteLimit: number) {
  const utf8str = unescape(encodeURIComponent(str));
  const byteLength = utf8str.length;
  if (byteLength > byteLimit) {
    const ratio = byteLimit / byteLength;
    const newStr = str.substring(0, Math.floor(str.length * ratio));
    return newStr;
  }
  return str;
}
function filterHalfRandomly<T>(arr: T[]): T[] {
  const filteredArr: T[] = [];
  const halfLength = Math.floor(arr.length / 2);
  const indicesToFilter = new Set<number>();

  // 随机生成要过滤掉的元素的下标
  while (indicesToFilter.size < halfLength) {
    const index = Math.floor(Math.random() * arr.length);
    if (!indicesToFilter.has(index)) {
      indicesToFilter.add(index);
    }
  }

  // 过滤掉要过滤的元素
  for (let i = 0; i < arr.length; i++) {
    if (!indicesToFilter.has(i)) {
      filteredArr.push(arr[i]);
    }
  }

  return filteredArr;
}
function getByteLength(text: string) {
  return unescape(encodeURIComponent(text)).length;
}

function itemInIt(textData: SubtitleItem[], text: string): boolean {
  return textData.find(t => t.text === text) !== undefined;
}

type SubtitleItem = {
  text: string;
  index: number;
}
export function getSmallSizeTranscripts(newTextData: SubtitleItem[], oldTextData: SubtitleItem[], byteLimit: number): string {
  const text = newTextData.sort((a, b) => a.index - b.index).map(t => t.text).join(" ");
  const byteLength = getByteLength(text);

  if (byteLength > byteLimit) {
    const filtedData = filterHalfRandomly(newTextData);
    return getSmallSizeTranscripts(filtedData, oldTextData, byteLimit);
  }

  let resultData = newTextData.slice();
  let resultText = text;
  let lastByteLength = byteLength;

  for (let i = 0; i < oldTextData.length; i++) {
    const obj = oldTextData[i];
    if (itemInIt(newTextData, obj.text)) {
      continue;
    }

    const nextTextByteLength = getByteLength(obj.text);
    const isOverLimit = lastByteLength + nextTextByteLength > byteLimit;
    if (isOverLimit) {
      const overRate = (lastByteLength + nextTextByteLength - byteLimit) / nextTextByteLength;
      const chunkedText = obj.text.substring(0, Math.floor(obj.text.length * overRate));
      resultData.push({ text: chunkedText, index: obj.index });
    } else {
      resultData.push(obj);
    }
    resultText = resultData.sort((a, b) => a.index - b.index).map(t => t.text).join(" ");
    lastByteLength = getByteLength(resultText);
  }

  return resultText;
}