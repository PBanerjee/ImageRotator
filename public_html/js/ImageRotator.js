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
                numCallbcks = callback.length;

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
        //list of slides
        this.slides = [];
        //list of styles
        this.styles = [];
        //list of slide elements as a batch
        this.slideElems = [];
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
            speed: 500, //ms
            stay: 5000,
            animating: false,
            currentSlide: 0
        };

    };

    ImageRotator.prototype = {

        /*
         * method to parse XML
         */

        parseXML: function(xmlData){
            var xmlDoc,
                slides = this.slides || [],
                styles = this.styles || [];
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
            //iterate over the slides and store data
            $(xmlDoc).find("slide").each(function(){
                var slide = {},
                    childNodes = this.childNodes,
                    numSlides = childNodes && childNodes.length,
                    i,
                    node,
                    nodeName;

                for(i = 0; i < numSlides; i += 1){
                    node = childNodes[i];
                    nodeName = node && node.nodeName.toLowerCase();

                    if(nodeName === 'image' || nodeName === 'heading'
                                        || nodeName === 'description'){
                        //check if any style is assigned
                        slide[nodeName] = {
                            styleId: $(node).attr("styleId"),
                            type: $(node).attr("type")
                        }
                        //nodeName is used to store the value
                        slide[nodeName][nodeName] = $(node).text();
                    }
                }
                slides.push(slide);
            });
            //update class level sildes object
            this.slides = slides;

            //iterate over the style object and store data
            $(xmlDoc).find("style").each(function(){
                var style = {},
                    attrMap = this.attributes;

                $.each(attrMap, function(){
                    style[this.nodeName] = this.nodeValue;
                });
                //for easy reference
                styles[style.id] = style;

                styles.push(style);
            });
            //update class level style object
            this.styles = styles;

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
         * function render content
         */
        render: function(){
            var imageContainer = $('<div id="imageContainer"></div>'),
                ulElem = $('<ul></ul>'),
                textContainer = $('<div id="textContainer"></div>'),
                i = 0,
                slides = this.slides,
                numSlides = slides && slides.length,
                slideObj,
                imgObj,
                imgSrc,
                imgStyleId,
                imgAltText,
                imgElem,
                headingObj,
                headingType,
                headingStyleId,
                heading,
                headerElem,
                descObj,
                descType,
                descStyleId,
                description,
                descElem;

             //append the div for the container of images
            this.container.append(imageContainer);
            //append the UL element to the image container.
            imageContainer.append(ulElem);
            //append the div for the container of heading & descriptions
            this.container.append(textContainer);
            //now dynimically create the images element based
            //on the slides
            for(i; i < numSlides; i += 1){
                slideObj = slides[i];
                //image
                imgObj = slideObj.image;
                imgSrc = imgObj.image;
                imgStyleId = imgObj.styleId;
                imgAltText = slideObj.altText || "image"+i;
                //create the image lement
                imgElem = $("<img src='"+imgSrc+"' alt='"+imgAltText+"' />");
                //now apply the style property is defined, apply to this elem
                imgStyleId && this.applyStyles(imgElem, imgStyleId);
                //append to the UL element
                ulElem.append(imgElem);
                //initially hide them
                imgElem.hide();

                //heading
                headingObj = slideObj.heading;
                headingType = headingObj && headingObj.type;
                headingStyleId = headingObj && headingObj.styleId;
                heading = headingObj && headingObj.heading;
                //create the header element
                headerElem = $("<"+headingType+">"+heading+"</"+headingType+">");
                //apply style
                headingStyleId && this.applyStyles(headerElem, headingStyleId);
                //append to the div
                textContainer.append(headerElem);
                //initially hide
                headerElem.hide();

                //description
                descObj = slideObj.description;
                descType = descObj && descObj.type;
                descStyleId = descObj && descObj.styleId;
                description = descObj && descObj.description;
                //create the description element
                descElem = $("<"+descType+">"+description+"</"+descType+">");
                //apply style
                descStyleId && this.applyStyle(descElem, descStyleId);
                //append
                textContainer.append(descElem);
                //initially hide
                descElem.hide();

                //add to the global slide Elements array
                this.slideElems[i] = {
                    image_element: imgElem,
                    header_element: headerElem,
                    desc_element: descElem
                };
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

        startRotate: function(){
            //put in a loop
            var scope = this;
            setTimeout( function(){
                scope.hidePrevSlide.call(scope);
                scope.showNextSlide.call(scope);
            }, this.defaults.speed);
        },

        hidePrevSlide: function(){
            var prevSlide = this.defaults.currentSlide - 1,
                numSlides = this.slideElems && this.slideElems.length,
                slideObj;

            //if there is no current slide nothing to do
            if((prevSlide != 0 && prevSlide < 0) ||
                            prevSlide >= numSlides){
                return;
            }

            //hide the current elements
            slideObj = this.slideElems[prevSlide];

            //hide all elements
            $(slideObj.image_element).hide();
            $(slideObj.header_element).hide();
            $(slideObj.desc_element).hide();
        },

        showNextSlide: function(){
            var currentSlide = this.defaults.currentSlide ||
                                (this.defaults.currentSlide = 0),
                numSlides = this.slideElems && this.slideElems.length,
                slideObj,
                scope = this;

            if(currentSlide >= numSlides){
               currentSlide = 0
            }

            slideObj = this.slideElems[currentSlide];

            //show all elements
            $(slideObj.image_element).show();
            $(slideObj.header_element).show();
            $(slideObj.desc_element).show();

             //increase the counter
            this.defaults.currentSlide = currentSlide + 1;

            //call next slide after the stay duration
            setTimeout(function(){
                scope.startRotate.call(scope);
            }, this.defaults.stay);
        }
    };

    //expose to the global scope
    window.ImageRotator = ImageRotator;

})(window, jQuery);


