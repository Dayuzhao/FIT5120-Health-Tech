<template>
  <header class="navbar">
    <div class="nav-container">
      <RouterLink to="/" class="logo" aria-label="Curbi home">
        <img src="/images/curbi-logo.png" alt="Curbi" />
      </RouterLink>

      <nav class="nav-links">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/urge">Urge Support</RouterLink>
        <RouterLink to="/help">Find Support</RouterLink>
      </nav>

      <div class="brand-icon">🌿</div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0px;
  z-index: 120;

  width: 120%;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e7ece8;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px 32px;

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
  width: 130px;
  height: auto;
  display: block;
}

.nav-links {
  display: flex;
  gap: 36px;
}

.nav-links a {
  color: #3f4943;
  text-decoration: none;
  font-size: 15px;
  padding: 8px 0;
  border-bottom: 2px solid transparent;
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