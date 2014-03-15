var scache = {
               vs1: new VirtualSelector(document.getElementById('landen'))
              ,vs2: new VirtualSelector(document.getElementById('yn'))
             };

// ----- //
function VirtualSelector(selector,maxsize) {
    var self      = this;
    self.maxsize  = maxsize || 12;
    self.id       = (Math.floor(Math.random()*10000000)).toString(16);
    self.selector = selector;
    self.txtinp   = createTextInput();
    self.selclone = createSelectorClone();
    self.list     = self.selclone.cloneNode(true)
    self.isopen   = false;
    self.origidx  = self.selector.selectedIndex;

    self.list.id = 'list_'+self.id;

    if (!VirtualSelector.prototype.initDone){
        var initObj = init();
        VirtualSelector.prototype.escapeRE = initObj.escapeRE;
        VirtualSelector.prototype.eventFire = initObj.eventFire;
        VirtualSelector.prototype.initDone;
    }

    function createTextInput(){
     var ti   = document.createElement('input')
        ,st   = ti.style
        ,sel  = self.selector
      ;
      ti.type = 'text';
      ti.id   = 'txt_'+self.id;
      st.position = 'absolute';
      ti.className = 'replacer';
      st.left = sel.offsetLeft + 'px';
      st.top = sel.offsetTop + 'px';
      st.width = sel.offsetWidth + 'px';
      st.height = sel.offsetHeight + 'px';
      st.background = 'url(./selectdwn1.png) 99.5% center no-repeat #eee';
      ti.onclick = click;
      ti.onkeydown = keydown;
      ti.onkeyup = keyUp;
      ti.title = 'klik voor selecteren/zoeken';
      document.body.appendChild(ti);
      ti.value = sel.options[sel.selectedIndex].text;
      return ti;
    }

    function createSelectorClone(){
      var sel    = self.selector
         ,sclone = sel.cloneNode(true);
      sclone.id = 'cloned_'+self.id;
      sclone.style.position = 'absolute';
      sclone.style.zIndex = '15';
      sclone.style.width = self.txtinp.offsetWidth + 'px';
      sclone.style.left = self.txtinp.style.left;
      sclone.style.top = '-500px';
      self.isopen = false;
      self.selector.style.position = 'absolute';
      self.selector.style.top = '-500px';
      sclone.selectedIndex = self.origidx;
      sclone.onclick = function(e) {
        self.selector.value = this.value;
        self.txtinp.value = self.selector.options[self.selector.selectedIndex].text;
        self.eventFire(self.txtinp, 'click');
        self.origidx = self.selector.selectedIndex;
      };
      document.body.appendChild(sclone);
      return sclone;
    }

    function init(){
     function escapeRE(str) {
        return str
            .replace(/([\[\]()-+{}.$\?\\])/g, '\\$1')
            .replace(/\*/, '.*')
            .replace(/&/g, '(.*)');
     }

     function eventFire(el, etype) {
        if (el.fireEvent) {
            (el.fireEvent('on' + etype));
        }
        else {
            var evObj = document.createEvent('Events');
            evObj.initEvent(etype, true, false);
            el.dispatchEvent(evObj);
        }
     }

     Number.prototype.In = Number.prototype.In || function() {
        var args = [].slice.call(arguments),
            l = args.length,
            val = this.valueOf();
        while (l--) {
            if (args[l] === val) {
                return true;
            }
        }
        return false;
     };
     String.prototype.trim = String.prototype.trim || function(){
      return this.replace(/^\s+|\s+$/,'');
     };
     return {
            eventFire: eventFire,
            escapeRE: escapeRE
           }
    }

    function keydown(e) {
        e = e || event;

        if (!self.isopen) {
           // firing event handles other open selects
           self.eventFire(this, 'click');
           this.keyhandled = true;
           return false;
        }

        var key    = e.keyCode || 0
           ,sclone = self.selclone
           ,sIndx  = sclone.selectedIndex
        ;

        if (key === 27 && self.isopen){  // >escape
            closeAll(e,true);
            return true;
        }

        if (key.In(35,36)){
          this.keyhandled = true;
          report(e.shiftKey);
        }

        if (key.In(34, 33, 38, 40)) { // >up/dwn/pageup/pagedwn
            sIndx += key === 38 ? -1 : key === 40 ? 1 : key === 33 ? -12 : 12;

            if (sIndx >= 0 && sIndx < sclone.length) {
                sclone.selectedIndex = sIndx;
            } else {
              sclone.selectedIndex = sIndx<0 ? 0 : sclone.length-1;
            }

            this.value = sclone.options[sclone.selectedIndex].text;
            this.focus();
            this.keyhandled = true;
            return false;
        }

        if (key.In(13) && sclone.size >= 1) { // >enter
            self.selector.value = sclone.value;
            close(sclone,this);
            this.keyhandled = true;
            self.origidx = self.selector.selectedIndex;
            return false;
        }
        return true;
    }

    function keyUp(e){
        e = e || event;

        if (this.keyhandled || e.shiftKey || e.ctrlKey){
            this.keyhandled = false;
            return false;
        }

        var val     = this.value
            ,len    = val.trim().length
            ,sclone = self.selclone
            ,re     = new RegExp(self.escapeRE(val), 'i')
            ,opts   = self.list.options
            ,clopts = sclone.options
            ,i      = 0
        ;

        // only filter if we have an actual value
        sclone.innerHTML = ''; //not elegant but makes that damned IE a LOT faster

        for (; i < opts.length; i=i+1) {
            if (val.length<1 || re.test(opts[i].text)) {
              //no cloning for ie<9 (IE should be abolished or ritually burned, really)
              sclone.options.add(new Option(opts[i].text,opts[i].value));
            }
        }

        if (sclone.length<1){
            sclone.add(new Option('geen opties', self.selector.selectedIndex));
            sclone.size = 1;
            return false;
        }

        if (sclone.length < 12) {
            sclone.size = sclone.length;
            //chrome/webkit: incorrect display, known bug, see
            //http://code.google.com/p/chromium/issues/detail?id=47581 or
            //http://jsfiddle.net/yqRjb/
        } else {
            sclone.size = 12;
        }
        sclone.selectedIndex = 0;
        return true;
    }

    function click(e){
        e = e || event;
        var sclone = self.selclone;
        if (sclone.size > 1) {
            /* remove later */
            report('');
            return close(sclone,this);
        } else {
            // close others first, then open current
            closeAll(e,true);
            return open(sclone,this);
        }
    }

    function close(sclone,fromTxtInput){
      sclone.size = 0;
      sclone.style.top = '-250px';
      self.isopen = false;
      fromTxtInput.value = self.selector.options[self.selector.selectedIndex].text;
      fromTxtInput.style.backgroundImage = 'url(./selectdwn1.png)';
      return true;
    }

    function open(sclone,fromTxtInput){
      document.body.removeChild(sclone);
      self.selclone = createSelectorClone();
      sclone = self.selclone;
      sclone.size = sclone.length > self.maxsize ? self.maxsize : sclone.length;
      sclone.style.top = (fromTxtInput.offsetTop + fromTxtInput.offsetHeight - 1) + 'px';
      sclone.selectedIndex = self.selector.selectedIndex;
      fromTxtInput.style.backgroundImage = 'url(./selectup1.png)';
      fromTxtInput.value = '';
      sclone.selectedIndex = self.origidx;
      self.isopen = true;
      return true;
    }

    function closeAll(e,force){
        e = e || event;
        var src = e.srcElement || e.target;
        if ( !force && src.id && /txt_|clone_/i.test(src.id) ){
          return false;
        }

        for (var sb in scache){
         if (scache.hasOwnProperty(sb) && scache[sb].isopen){
            var current = scache[sb]
               ,selector = current.selector
               ,sclone   = current.selclone
               ,txtinp   = current.txtinp
             ;
             sclone.size = 0;
             sclone.style.top = '-250px';
             current.isopen = false;
             txtinp.value = selector.options[selector.selectedIndex].text;
             txtinp.style.backgroundImage = 'url(./selectdwn1.png)';
          }
        }
    }

    // set global click handler if not already done
    if (!document.body.sbclickdone){
        document.body.onclick = closeAll;
        document.body.sbclickdone = true;
    }
}

/* remove later */
function report(txt,add){
    var debug = document.getElementById('debug');
    debug.innerHTML = add ? debug.innerHTML + '<br />'+txt : txt;
}