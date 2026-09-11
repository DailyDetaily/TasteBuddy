#!/usr/bin/env python3
"""Swift의 정적 카탈로그 리터럴만 읽어 JSON으로 옮긴다. Swift 코드를 실행하지 않는다."""
import argparse
import json
import re
from pathlib import Path

android = Path(__file__).resolve().parents[1]
args = argparse.ArgumentParser()
args.add_argument("--source", type=Path, default=android.parent / "ios/TasteBuddy")
source = args.parse_args().source

class LiteralReader:
    def __init__(self, text):
        self.tokens = re.findall(r'"(?:\\.|[^"\\])*"|-?\d[\d_]*(?:\.\d+)?|\.?[A-Za-z_][A-Za-z_0-9.]*|[\[\]():,]', text)
        self.i = 0
    def take(self):
        value = self.tokens[self.i]
        self.i += 1
        return value
    def peek(self):
        return self.tokens[self.i] if self.i < len(self.tokens) else None
    def expect(self, token):
        found = self.take()
        assert found == token, (token, found)
    def value(self):
        token = self.take()
        if token == '[':
            if self.peek() == ']': self.take(); return []
            first = self.value()
            if self.peek() == ':':
                result = {}; self.take(); result[str(first)] = self.value()
                while self.peek() == ',':
                    self.take()
                    if self.peek() == ']': break
                    key = self.value(); self.expect(':'); result[str(key)] = self.value()
            else:
                result = [first]
                while self.peek() == ',':
                    self.take()
                    if self.peek() == ']': break
                    result.append(self.value())
            self.expect(']'); return result
        if token.startswith('"'):
            assert '\\(' not in token, '계산된 문자열은 정적 내보내기 대상이 아닙니다'
            return json.loads(token)
        if token == 'nil': return None
        if token in ['true', 'false']: return token == 'true'
        if re.fullmatch(r'-?\d[\d_]*(?:\.\d+)?', token): return float(token) if '.' in token else int(token.replace('_', ''))
        if self.peek() == '(':
            self.take(); result = {}
            while self.peek() != ')':
                key = self.take(); self.expect(':'); result[key] = self.value()
                if self.peek() == ',': self.take()
                else: break
            self.expect(')'); return result
        if token.startswith('.'): return token[1:]
        raise ValueError(f'정적 리터럴이 아닌 토큰: {token}')

def extract(path, name):
    text = (source / path).read_text()
    marker = re.search(r'static let ' + re.escape(name) + r'\s*:[^=]+=', text)
    assert marker, name
    return LiteralReader(text[marker.end():]).value()

content = {
    'restaurants': extract('Models/RestaurantModels.swift', 'restaurants'),
    'tasteMatchFeed': extract('Models/TasteModels.swift', 'tasteMatchFeed'),
    'followingDishFeedbackItems': extract('Models/TasteModels.swift', 'followingDishFeedbackItems'),
    'fallbackDishFeedbackItems': extract('Models/TasteModels.swift', 'fallbackDishFeedbackItems'),
    'seededDishFeedbackComments': extract('Models/TasteModels.swift', 'seededDishFeedbackComments'),
}
dest = android / 'app/src/main/assets/catalog/native-content.json'
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n')
print('iOS 정적 카탈로그 5종 내보내기 완료')
