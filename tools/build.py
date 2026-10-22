"""Inline all CSS and JS into one self-contained HTML file.

dist/novacancy.html  - full standalone page (open directly in a browser)
dist/artifact.html      - same content without <html>/<head>/<body> wrappers
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(ROOT, 'index.html')).read()

def inline_css(m):
    return '<style>\n' + open(os.path.join(ROOT, m.group(1))).read() + '\n</style>'

def inline_js(m):
    src = open(os.path.join(ROOT, m.group(1))).read().replace('</script', '<\\/script')
    return '<script>\n' + src + '\n</script>'

out = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', inline_css, html)
out = re.sub(r'<script src="(js/[^"]+)"></script>', inline_js, out)
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
open(os.path.join(ROOT, 'dist', 'novacancy.html'), 'w').write(out)

head = re.search(r'<head>(.*)</head>', out, re.S).group(1)
body = re.search(r'<body>(.*)</body>', out, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>\s*', '', head)
head = re.sub(r'<meta name="viewport"[^>]*>\s*', '', head)
head = re.sub(r'<link rel="(manifest|apple-touch-icon|icon)"[^>]*>\s*', '', head)
open(os.path.join(ROOT, 'dist', 'artifact.html'), 'w').write(head.strip() + '\n' + body.strip() + '\n')
print('built', os.path.getsize(os.path.join(ROOT, 'dist', 'novacancy.html')), 'bytes')
