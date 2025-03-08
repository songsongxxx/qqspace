<script>
	// 你的逻辑代码可以写在这里
</script>

<main>
	<div class="dream-content">
		<h1>Welcome to the Dream Page!</h1>
		<p>This is the dream content area.</p>
	</div>
</main>

<style>
	.dream-content {
	background-color: white;
	width: 100%;
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	text-align: center;
	position: relative; /* 使 z-index 生效 */
	z-index: 10; /* 确保 dream 页面在 app 页面之上 */
	}

	h1 {
	font-size: 2em;
	}

	p {
	font-size: 1.2em;
	}
</style>
