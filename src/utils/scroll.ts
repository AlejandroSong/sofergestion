export function scrollToSection(id: string) {
  const run = () => {
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  };
  if (run()) return;
  window.setTimeout(run, 80);
  window.setTimeout(run, 220);
  window.setTimeout(run, 500);
}
