<script>
	import { Router, Route, Link } from 'svelte-routing';
	import Dream from './routes/Dream.svelte';  // 导入 Dream 页面组件
</script>

<main>
	<Router>
		<div class="circle-container">
			<Link to="/dream" class="circle" style="--i: 0;">dreams</Link>
			<div class="circle" style="--i: 1;">qq space</div>
			<div class="circle" style="--i: 2;">yewen's home</div>
			<div class="circle" style="--i: 3;">audrey's home</div>
			<div class="circle" style="--i: 4;">george's home</div>
		</div>

		<Route path="/dream" component={"Dream"} />
	</Router>
</main>

<style>
	.circle-container {
	position: relative;
	width: 300px;
	height: 300px;
	display: flex;
	justify-content: center;
	align-items: center;
	}

	.circle {
	position: absolute;
	width: 120px;
	height: 120px;
	background-color: transparent; /* 无填充颜色 */
	border: 3px solid black; /* 黑色边框 */
	border-radius: 50%;
	display: flex;
	justify-content: center;
	align-items: center;
	color: black;
	font-size: 14px;
	text-align: center;
	padding: 10px;
	font-weight: bold;
	transform: rotate(calc(var(--i) * 72deg)) translateY(-140px) rotate(calc(var(--i) * -72deg));
	}
</style>
