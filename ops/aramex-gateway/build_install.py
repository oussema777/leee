"""Generate the user-reviewable PuTTY install block; executes no shell commands."""
from pathlib import Path

root = Path(__file__).resolve().parent
text = (root / 'install-template.txt').read_text(encoding='utf-8')
text = text.replace('# Copy the generated install-in-putty.txt file, not this template.', '# Copy this entire block into the VPS PuTTY terminal.')
text = text.replace('@@GATEWAY_PY@@', (root / 'gateway.py').read_text(encoding='utf-8').rstrip())
text = text.replace('@@SERVICE_UNIT@@', (root / 'lee-aramex-gateway.service').read_text(encoding='utf-8').rstrip())
(root / 'install-in-putty.txt').write_text(text, encoding='utf-8', newline='\n')
print('Prepared install-in-putty.txt. No VPS command executed.')
