<script lang="ts">
  export let open = false;
</script>

<button 
  class="hamburger-menu" 
  class:open 
  on:click
  aria-label="Toggle menu"
  aria-expanded={open}
>
  <div class="bar1"></div>
  <div class="bar2"></div>
  <div class="bar3"></div>
</button>

<style>
  .hamburger-menu {
    display: none; /* Hidden by default, shown via media query */
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 3000; /* Above everything */
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 22px;
  }

  @media (max-width: 768px) {
    .hamburger-menu {
      display: block;
    }
  }

  .bar1, .bar2, .bar3 {
    width: 30px;
    height: 3px;
    background-color: var(--text-primary);
    margin: 5px 0;
    transition: 0.4s;
    border-radius: 3px;
  }

  .open .bar1 {
    transform: rotate(-45deg) translate(-6px, 6px);
  }

  .open .bar2 {
    opacity: 0;
  }

  .open .bar3 {
    transform: rotate(45deg) translate(-7px, -7px);
  }
</style>
