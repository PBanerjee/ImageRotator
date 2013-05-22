/* Scope and self initiation */

//event architecture
(function(glob){
    var Event = function(scope){
        this.scope = scope;
    };

    //blue prints
    Event.prototype = {
        listeners: [],

        addEventListener: function(eventType, callback){
            //check if eventType and callback is defined
            //or fail silently.
            if(!eventType || !callback){
                return;
            }
            //if eventType is not added to the listeners
            //hash table. Add It.
            if(!this.listeners[eventType]){
                this.listeners[eventType] = {
                    eventType: eventType,
                    callback: [callback]
                };
            }else{
                //add to the existing list of callbacks
                this.listeners[eventType].callback.push(callback);
            }
        },

        removeEventListener: function(eventType){
            //if eventType is not defined, there is
            //nothing to do
            if(!eventType){
                return;
            }
            //now check whether any event exists as eventType
            //in the listeners hashTable and then delete
            if(this.listeners[eventType]){
                this.listeners[eventType] = null;
            }
        },

        dispatchEvent: function(eventType){
            //get the obj from the listeners hashTable
            var evtObj = this.listeners[eventType],
                callback = evtObj && evtObj.callback,
                i = 0,
                numCallbcks = callback && callback.length;

            for(i; i < numCallbcks; i += 1){
                if(callback[i]){
                    callback[i].call(this.scope);
                }
            }
        }
    };

    //expose to the global scope
    glob.Event = Event;

}(this));

(function(window, $){

    /*
     * @param   data    The object which contains the data as XML
     *                  or the url for the XML.
     */
    var ImageRotator = function(data, containerDivID){
        //list of containers
        this.containers = [];
        //list of slides
        this.slides = [];
        //list of styles
        this.styles = [];
        //list of animations
        this.animations = [];
        //list of navigators
        this.navigators = [];
        //need to load or parse the data.
        this.dataObj = data;
        //start data fectching or parsing
        this.dataObj && this.getData();
        //subscribe to the event object
        this.event = new Event(this);
        //store the container div
        //@todo: need to auto detect the # sign.
        this.container = $("#"+containerDivID);
        //default options
        this.defaults = {
            autoChange: true,
            navigation: false,
            speed: 1000, //ms
            stay: 5000,
            onGoingAnimation: 0,
            animating: false,
            currentSlide: null
        };
        //initiate and bound the animation object
        this.animationManager = new AnimationManager(this);

    };

    ImageRotator.prototype = {

        /*
         * method to parse XML
         */

        parseXML: function(xmlData){
            var imgRotator = this,
                xmlDoc,
                firstChld,
                dataCues,
                autoChange,
                navigation,
                i,
                cue,
                cueLength;
            //check whether the passed data is in XML format
            //remove white spaces (trim)
            if(xmlData.childNodes){
                //direct assignments
                //@todo: how to remove whitespace in already an
                //XML document.
                xmlDoc = xmlData;
            }
            //else convert to XML
            else{
                xmlDoc = $.parseXML($.trim(xmlData));
            }

            //now get the top level data cues to parse data
            firstChld = $(xmlDoc.firstChild);
            dataCues = firstChld.attr('dataCues');
            dataCues && (dataCues = dataCues.split(','));
            //other top level attributes
            imgRotator.defaults.autoChange = autoChange =
                    firstChld.attr('autoChange') === 'true' ? true : false;

            navigation = !autoChange;
            //

            for(i = 0, cueLength = dataCues.length; i < cueLength; i += 1){
                cue = dataCues[i];
                $(xmlDoc).find(cue).each(function(){
                    var node = this,
                        nodeName = node && node.nodeName.toLowerCase(),
                        obj = {},
                        chldNodes = node && node.childNodes,
                        globalArray,
                        parseAttribute;

                    //attribute parsing for any given node
                    parseAttribute = function(node){
                        var obj = {},
                            attrMap = node && node.attributes;

                        $(attrMap).each(function(){
                            obj[this.nodeName] = this.nodeValue;
                        });

                        return obj;
                    }

                    //get the attributes for this node
                    obj = parseAttribute(node);
                    //get to the next level
                    $(chldNodes).each(function(){
                        var chldNode = this,
                            nodeName = chldNode &&
                                    chldNode.nodeName.toLowerCase();

                        //ignoring white space is not working
                        //to bypass this we should omit any node, which strts with
                        //a # sign
                        if(nodeName.charAt(0) === "#"){
                            //skip
                            return;
                        }

                        obj[nodeName] = parseAttribute(chldNode);
                        //node value
                        obj[nodeName]['value'] = $(chldNode).text();
                    });
                    //add to the global arrays
                    globalArray = imgRotator[nodeName+'s'];
                    //if object has a id property for easy refernce
                    //store the objcet in the global array with id as key
                    obj.id && globalArray && (globalArray[obj.id] = obj);
                    //store with index.
                    globalArray && globalArray.push(obj);
                })
            };
            //also update the animatons array in animation
            //manager
            this.animationManager.setAnimations(this.animations);
            //fire XML parse complete event
            this.event.dispatchEvent('xml-parsed');
        },

        /*
         * function to load the data.
         */
        getData: function(){
            var dataObj = this.dataObj,
                dataXML = dataObj && dataObj.dataXML,
                dataURL = dataObj && dataObj.dataURL,
                scope = this;
            //check if dataObj is defined or return
            if(!dataObj){
                return;
            }
            //now depending on the data type either loads the data
            //or parse it.
            if(dataXML && dataXML.length > 0){
                //parse the XML
                this.parseXML(dataXML);
            }else if(dataURL){
                //load the XML
                $.ajax({
                   scope: scope, // parent scope need to be passed.
                   url: dataURL,
                   success: function(args){
                       this.scope.parseXML(args);
                   },
                   error: function(e){
                       //@todo: need to define a proper error report
                       //mechanism.
                       console.log(e.responseText);
                   }
                });
            }
        },

        /*
         * A recursive method to create elements
         */
        createElement: function(elementObj){
            //if element object or object type is not defined
            //nothing to do
            if(!elementObj || !elementObj.type){
                return;
            }

            var topContainer = this.container,
                containers = this.containers,
                elementId = elementObj.id,
                styleId = elementObj.styleId,
                parentContId = elementObj.containerId,
                parentContainer = parentContId && containers[parentContId] &&
                                    containers[parentContId].containerElement,
                container,

                elementType = elementObj.type,
                elemStr = '<'+elementType+'></'+elementType+'>',
                element;

            /*
             * in case parent container is undefined
             * check whether any element exist with the parent Id
             */
            parentContainer = $('#'+parentContId)[0];
            /* In case parent container is still undefined
             * either the parent container is not created
             * or this element to be added to the main container
             */
            if(!parentContainer){


                parentContainer = parentContId ?
                                    this.createElement(containers[parentContId])
                                    : topContainer;
            }

            //create and append to the parent element
            element = $(elemStr).appendTo(parentContainer);
            //add the common attributes
            element.attr('id', elementId);
            //specific attribute managements
            switch(elementType){
                case 'img' :
                    elementObj.value &&
                            element.attr('src', elementObj.value);
                    break;
                default :
                    elementObj.value &&
                            element.html(elementObj.value);

            }
            //apply the styles
            styleId && this.applyStyles(element, styleId);
            //add to the containers array if id is defined
            if(elementId){
                container = this.containers[elementId] || {};
                container.containerElement = element;
            }
            return element;

        },

        /*
         * function render content
         */
        render: function(){
            var imgRot = this,
                slides = this.slides,
                navigators = this.navigators,
                containers = this.containers,
                slide,
                navigator,
                elementObj,
                navElem,
                element,
                numSlides = slides && slides.length,
                numOfNavigators = navigators && navigators.length,
                clickMethod,
                i;

            for(i = 0; i < numSlides; i += 1){

                slide = slides[i];
                //iterate over each elements of a single slide
                for(var prop in slide){
                    //only child elements of a slide node
                    //can be a separate HTML element
                    if(slide[prop] instanceof Object){
                        elementObj = slide[prop];
                        element = this.createElement(elementObj);
                        if(elementObj.excludeAnimation !== 'true'){
                            elementObj.element = element;
                            element.hide();
                            //all elements thus at begining is inactive
                            element.active = false;
                        }
                    }
                }
            }

            //create the navigaots if defined
            for(i = 0; i < numOfNavigators; i += 1){
                navigator = navigators[i];
                navElem = this.createElement(navigator);
                clickMethod = navigator.click;
                //bind method to proper scope
                (function(){
                    var method = clickMethod;
                    method && navElem.click(function(){
                        imgRot[method].call(imgRot);
                    })
                })();
            }
            //fire the creation complete event
            this.event.dispatchEvent('creation-complete');
        },

        applyStyles: function(element, imgStyleId){
            //get the style object from the styles array
            var styleObj = this.styles[imgStyleId];
            if(styleObj){
                for(var prop in styleObj){
                    $(element).css(prop, styleObj[prop]);
                }
            }
        },

        nextSlide: function(){
            //just by-pass the call to changeSlide as changeSlide
            //only moves to the next slide.
            //only if no animation is on going
            this.changeSlide();
        },

        prevSlide: function(){
             //now as we need to navigate to the prev slide
             //call the change slide with proper direction
             this.changeSlide('prev');
        },

        changeSlide: function(direction){
            var imgRot = this,
                AnimMngr = imgRot && imgRot.animationManager,
                isAnimating = AnimMngr && AnimMngr.isAnimating() || false,
                isPrev = direction === 'prev' ? true : false,
                currentSlideNum = this.defaults.currentSlide,
                slides = this.slides,
                animations = this.animations,
                slideElems = this.slideElems,
                totalSlides = slides && slides.length,
                nextSlideNum,
                currentSlideObj,
                nextSlideObj;

            //if any animation is on going. ignore this call
            if(isAnimating){
                return;
            }

            //if current slide is null (first time) and is not 0 (as zero will
            //also be evaluated to false), assign the base -1 current slide
            //number
            !currentSlideNum && currentSlideNum !== 0 && (currentSlideNum = -1);
            //now based on the current slide and direction get the next slide
            if(!isPrev){
                nextSlideNum = currentSlideNum ===
                    (totalSlides - 1) ? 0 : currentSlideNum + 1;
            }else{
                nextSlideNum = currentSlideNum === 0
                     ? (totalSlides - 1) : currentSlideNum - 1;
            }

            //get slide objects and elements
            currentSlideObj = slides[currentSlideNum];
            nextSlideObj = slides[nextSlideNum];

            if(currentSlideObj || nextSlideObj){
                this.animationManager.start(currentSlideObj, nextSlideObj, this.startStay);
            }

            //nextSlideObj && this.new_initAnimation(nextSlideObj, 'show');
            //update current slider
            this.defaults.currentSlide = nextSlideNum;
        },

        startStay: function(){
            //from here after the stipulated stay time
            //fire the change slide method
            var imgRot = this,
                autoChange = this.defaults.autoChnage,
                stayDuration = this.defaults.stay;

            //fire the stay start event @todo: think better name
            this.event.dispatchEvent('stay-start');

            setTimeout(function(){
                //fire the stay complete event
                imgRot.event.dispatchEvent('stay-complete');
                //call for the next slide only if autoChane is true
                autoChange && imgRot.changeSlide.call(imgRot);
            },stayDuration);
        }

    };

    //expose to the global scope
    window.ImageRotator = ImageRotator;

})(window, jQuery);


