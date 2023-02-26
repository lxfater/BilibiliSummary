
const cardContainer = document.querySelector('#app > div > div.rank-container > div.rank-list-wrap > ul');
if(cardContainer) {
    let jobs = [];
    cardContainer.childNodes.forEach((node) => { 
        // get the url of a element in the children of node
        const url = node.querySelector('a').href;
        const newDiv = document.createElement('div');
        newDiv.style.height = '100px';
        newDiv.style.width = '100%';
        newDiv.style.pointerEvents = 'all';
        newDiv.style.overflow = 'hidden';
        newDiv.innerHTML = '总结加载中...'
        node.appendChild(newDiv);
        jobs.push({
            url: url,
            div: newDiv
        })
    });
}

