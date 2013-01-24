JFormComponentCreditCard = JFormComponent.extend({
    init: function(parentJFormSection, jFormComponentId, jFormComponentType, options) {
        this._super(parentJFormSection, jFormComponentId, jFormComponentType, options);
    },

    initialize: function(){
        this.tipTarget = this.component;
        if(this.options.emptyValues){
            this.addEmptyValues();
        }
        this.validationFunctions = {
            //Name Validations
            'required': function(options) {
                var errorMessageArray = [];
                if(options.value.cardType != undefined && options.value.cardType == '') {
                    errorMessageArray.push(['Card type is required.']);
                }
                if(options.value.cardNumber == '') {
                    errorMessageArray.push(['Credit card number is required.']);
                } 
                if(options.value.cardNumber != '' && options.value.cardNumber.match(/[^\d]/)){
                    errorMessageArray.push(['Card number may only contain numbers.']);
                }
                if(options.value.cardNumber != '' && (options.value.cardNumber.length < 13 || options.value.cardNumber.length > 16)){
                    errorMessageArray.push(['Card number must contain 13 to 16 digits.']);
                }
                if(options.value.expirationMonth == '') {
                    errorMessageArray.push(['Expiration month is required.']);
                }
                if(options.value.expirationYear == '') {
                    errorMessageArray.push(['Expiration year is required.']);
                }
                if(options.value.securityCode != undefined && options.value.securityCode == '') {
                    errorMessageArray.push(['Security code is required.']);
                }
                if(options.value.securityCode != undefined && options.value.securityCode != '' && options.value.securityCode.match(/[^\d]/)) {
                    errorMessageArray.push(['Security code may only contain numbers.']);
                }
                if(options.value.securityCode != undefined && options.value.securityCode != '' && options.value.securityCode.length < 3){
                    errorMessageArray.push(['Security code must contain 3 or 4 digits.']);
                }
                return errorMessageArray.length < 1 ? 'success' : errorMessageArray;
            }
        }
        
        this.changed = false;
    },

    setValue: function(data) {
        var self = this;
        if(this.options.emptyValues){
            if(data.cardType != undefined){
                self.component.find(':input[id*=cardType]').removeClass('defaultValue').val(data.cardType).blur();
            }
            if(data.cardNumber != this.options.emptyValues.cardNumber){
                self.component.find(':input[id*=cardNumber]').removeClass('defaultValue').val(data.cardNumber).blur();
            }            
            self.component.find(':input[id*=expirationMonth]').removeClass('defaultValue').val(data.expirationMonth).blur();
            self.component.find(':input[id*=expirationYear]').removeClass('defaultValue').val(data.expirationYear).blur();
            if(data.securityCode != undefined && data.securityCode != this.options.emptyValues.securityCode){
                self.component.find(':input[id*=expirationMonth]').removeClass('defaultValue').val(data.expirationMonth).blur();
            }
        }
        else {
            if(data.cardType != undefined){
                self.component.find(':input[id*=cardType]').val(data.cardType);
            }
            self.component.find(':input[id*=cardNumber]').val(data.cardNumber);
            self.component.find(':input[id*=expirationMonth]').val(data.expirationMonth);
            self.component.find(':input[id*=expirationYear]').val(data.expirationYear);
            if(data.securityCode != undefined){
                self.component.find(':input[id*=securityCode]').val(data.securityCode);
            }
        }
        this.validate(true);
        /*
        $.each(data, function(key, value){
            if(self.options.emptyValue[key] != undefined && data[key] != self.options.emptyValue[key]){
                self.component.find(':input[id*='+key+']').removeClass('defaultValue').val(value).trigger('component:changed').blur();
            } else if (self.options.emptyValue[key] == undefined) {
                self.component.find(':input[id*='+key+']').val(value).trigger('component:changed');
            } else {
                self.component.find(':input[id*='+key+']').val(value).trigger('component:changed');
            }
        });*/
    },

    getValue: function() {
        if(this.disabledByDependency || this.parentJFormSection.disabledByDependency){
           return null;
        }
        var creditCardInfo = {};

        // Get the values
        if(this.component.find(':input[id*=cardType]').length != 0){
            creditCardInfo.cardType = this.component.find(':input[id*=cardType]').val();
        }
        creditCardInfo.cardNumber = this.component.find(':input[id*=cardNumber]').val();
        creditCardInfo.expirationMonth = this.component.find(':input[id*=expirationMonth]').val();
        creditCardInfo.expirationYear = this.component.find(':input[id*=expirationYear]').val();
        if(this.component.find(':input[id*=securityCode]').length != 0){
            creditCardInfo.securityCode = this.component.find(':input[id*=securityCode]').val();
        }
        if(this.options.emptyValues){
            if(creditCardInfo.cardNumber == this.options.emptyValues.cardNumber){
                creditCardInfo.cardNumber = '';
            }
            if(creditCardInfo.securityCode != undefined && creditCardInfo.securityCode == this.options.emptyValues.securityCode){
                creditCardInfo.securityCode = '';
            }
        }
        return creditCardInfo;
    },

    validate: function(silent, options){
        if(!this.parentJFormSection.parentJFormPage.jFormer.options.clientSideValidation) {
            return;
        }

        var self = this;
        if(!this.changed){
            this._super();
        }
        
        var componentPromise = $.Deferred();

        setTimeout(function() {
            if(!self.component.hasClass('jFormComponentHighlight')){
                if(self.options.validationOptions.length < 1){
                    return true;
                }
                self.clearValidation();

                var validationPromises = [];
                $.each(self.options.validationOptions, function(validationType, validationOptions){
                    validationOptions['callOptions'] = options || {};
                    validationOptions['value'] = self.getValue();
                    validationPromises.push(self.validationFunctions[validationType](validationOptions).done(function(validation) {
                        if(validation != 'success'){
                            $.merge(self.errorMessageArray, validation);
                        }
                    }));
                });

                $.when.apply($, validationPromises).done(function() {
                    // Determine if all validations passed
                    var validationResults = Array.prototype.slice.call(arguments);
                    var validationPassed = $.grep(validationResults, function(result) {
                        return (result !== 'success');
                    }).length == 0;

                    if(self.errorMessageArray.length > 0 ){
                        self.handleErrors();
                    }

                    self.changed = false;

                    componentPromise.resolve(validationPassed ? 'success' : self.errorMessageArray);
                });
            }
        }, 1);

        return componentPromise;
    },

    addEmptyValues: function(){
        var self = this,
        emptyValues = this.options.emptyValues;
        $.each(emptyValues, function(key, value){
            var input = self.component.find('input[id*='+key+']');
            input.addClass('defaultValue');
            input.focus(function(event){
                if ($.trim($(event.target).val()) == value ){
                    $(event.target).val('');
                    $(event.target).removeClass('defaultValue');
                }
            });
            input.blur(function(event){
                if ($.trim($(event.target).val()) == '' ){
                    $(event.target).addClass('defaultValue');
                    $(event.target).val(value);
                }
            });
            input.trigger('blur');
        });
    }
});
