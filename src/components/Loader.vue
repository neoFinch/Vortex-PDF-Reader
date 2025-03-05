<template>
  <div class='bouncing-loader'>
    <div></div>
    <div></div>
    <div></div>
  </div>
</template>

<style scoped>
.bouncing-loader {
  display: flex;
  justify-content: center;
  font-size: 8px;
}

.bouncing-loader>div {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: #8385aa;
  margin: 8px 0.2rem;
  animation: jumping 0.5s infinite;
  animation-direction: alternate-reverse;
}



@keyframes jumping {
  to {
    opacity: 0.1;
    transform: translate3d(0, -0.5rem, 0)
  }
}

.bouncing-loader>div:nth-child(2) {
  animation-delay: 0.2s;
}

.bouncing-loader>div:nth-child(3) {
  animation-delay: 0.4s;
}
</style>