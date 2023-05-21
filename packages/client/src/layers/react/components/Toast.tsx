import React from "react";
import { registerUIComponent } from "../engine";
import { concat, map, of } from "rxjs";
import {ToastContainer, toast, Slide} from 'react-toastify';

export function registerToast() {
	registerUIComponent(
		"Crosshairs",
		{
			rowStart: 2,
			rowEnd: 13,
			colStart: 1,
			colEnd: 13,
		},
		(layers) => concat(of(1)),
		() => {
			return <ToastContainer toastStyle={{marginTop: 2, marginLeft: 20}} newestOnTop={true} autoClose={1000} hideProgressBar={true}/>
		}
	);
}