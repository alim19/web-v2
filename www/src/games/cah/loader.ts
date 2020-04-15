interface cahCreateData {
	name: string,
		packs: string[],

		max_players ? : number,
		timeout ? : number,
		password ? : string,
}

const c_styles = {}

async function customCreate(): Promise < cahCreateData > {

	let w = document.getElementById("wCreate");
	if (w) w.remove();
	let d = document.createElement("div");
	d.id = "wCreate";
	document.getElementById("container").appendChild(d);


	let tName = document.createElement("input");
	tName.setAttribute("type", "text");
	tName.value = "name";
	tName.id = "tName";
	d.appendChild(tName);
	tName.focus();

	d.appendChild(document.createElement("br"));
	let _packs = document.createElement("p");
	_packs.innerText = "Packs: ";
	d.appendChild(_packs);

	//@ts-ignore
	let add_packs = document.createElement("div");
	add_packs.id = "packs";
	d.appendChild(add_packs);
	getPacks()
	.then(packs => {
		for (let pack of packs) {
			let s = document.createElement("span");
			s.className = "spanPack";
			add_packs.appendChild(s);
			//@ts-ignore
			let p = document.createElement("input");
			p.innerText = pack;
			p.setAttribute("type", "checkbox");
			s.appendChild(p);

			let p_id = crypto.getRandomValues(new Uint32Array(1)).toString();
			p.id = p_id;

			let l = document.createElement("label");
			l.setAttribute("for", p_id);
			l.innerText = pack;
			s.appendChild(l);
			p.className = "checkPack";
			if (pack == "Cards against humanity") {
				p.setAttribute("disabled", "disabled");
				p.setAttribute("checked", "checked");
			}
		}
	});


	d.appendChild(document.createElement("br"));

	let pwd = document.createElement("div");
	d.appendChild(pwd);

	let p = document.createElement("input");
	p.setAttribute("type", "text");
	p.id = "tPass";
	pwd.appendChild(p);
	p.setAttribute("placeholder", "password");

	let c = document.createElement("input");
	c.id = "cPass";
	c.setAttribute("type", "checkbox");
	pwd.appendChild(c);
	c.onmouseup = () => {
		setInterval(() => {
			//@ts-ignore
			if (c.checked)
				p.setAttribute("type", "text");
			else
				p.setAttribute("type", "password");

		}, 0)
	};

	let cpL = document.createElement("label");
	cpL.setAttribute("for", "cPass");
	cpL.innerText = "Show password?";
	pwd.appendChild(cpL);

	let b = document.createElement("div");
	d.appendChild(b);


	let s1 = document.createElement("span");
	b.appendChild(s1);

	let bCreate = document.createElement("button");
	s1.appendChild(bCreate);
	bCreate.id = "bCreate";
	bCreate.className = "wB";
	bCreate.innerText = "Create.";

	let s2 = document.createElement("span");
	b.appendChild(s2);

	let bCancel = document.createElement("button");
	s2.appendChild(bCancel);
	bCancel.id = "bCancel";
	bCancel.innerText = "Cancel.";
	return new Promise < cahCreateData > ((resolve, reject) => {
		bCreate.onmouseup = () => {

			//resolve

			// console.log(add_packs.child());

			let packs = [];

			let ePacks = document.getElementById("packs");
			// packs.forEach(console.log);
			for (let p of ePacks.children) {
				let label = p.getElementsByTagName("label").item(0).innerText;
				let checked = p.getElementsByTagName("input").item(0).checked;
				console.log({
					label,
					checked
				});
				if (checked) {
					packs.push(label);
				}
			}

			let createData: cahCreateData = {
				//@ts-ignore
				name: document.getElementById("tName").value,
				packs: packs,
				//@ts-ignore
				password: document.getElementById("tPass").value,
			}
			d.remove();

			resolve(createData);
		};
		bCancel.onmouseup = () => {
			//resolve

			d.remove();
			resolve(null);
		};

	})
}

async function getPacks(): Promise < string[] > {
	let res = await fetch("/games/api/cah/packs", {
		method: "GET",
	});

	if (res.status == 200) {
		return res.json();
	} else {
		return null;
	}

}