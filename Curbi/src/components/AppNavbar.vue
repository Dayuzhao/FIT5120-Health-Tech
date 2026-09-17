<template>
  <header class="navbar">
    <div class="nav-container">
      <RouterLink to="/" class="logo" aria-label="Curbi home">
        <img src="/images/curbi-logo.png" alt="Curbi" />
        <span class="iteration-badge">Iteration 2</span>
      </RouterLink>

      <nav class="nav-links">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/urge">Urge Support</RouterLink>
        <RouterLink to="/play">Play</RouterLink>
        <RouterLink to="/help">Find Support</RouterLink>
      </nav>

    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;

  width: 100%;

  background: rgba(244, 249, 244, 0.82);
  backdrop-filter: blur(14px);

  border-bottom: 1px solid rgba(68, 112, 82, 0.12);
}

.nav-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 14px 32px;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo img {
  display: block;
  width: 150px;
  height: auto;
}

.iteration-badge {
  margin-left: 8px;
  padding: 3px 10px;

  background: #e7f0e9;
  color: #2f714a;

  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;

  border-radius: 999px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;

  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.nav-links a {
  color: #4e6254;
  text-decoration: none;

  font-size: 14px;
  font-weight: 500;

  padding: 8px 2px;

  border-bottom: 2px solid transparent;

  transition:
    color 180ms ease,
    border-color 180ms ease;
}

.nav-links a:hover {
  color: #2f714a;
}

.nav-links a.router-link-active {
  color: #2f714a;
  border-bottom-color: #2f714a;
}

.brand-icon {
  font-size: 24px;
}

@media (max-width: 700px) {
  .nav-container {
    padding: 16px 20px;
  }

  .nav-links {
    gap: 14px;
  }

  .nav-links a {
    font-size: 13px;
  }

  .brand-icon {
    display: none;
  }
}
</style>