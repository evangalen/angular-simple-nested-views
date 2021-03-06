;(function() {
    'use strict';

    var ngSwitchWhenCompileAlreadyWrapped = false;

    var wrapNgSwitchWhenCompile = function(compileFn) {
        return function wrappedNgSwitchWhenCompile(element, attrs, transclude) {
            var wrappedTransclude = wrapNgSwitchWhenCompileTransclude(transclude);
            return compileFn(element, attrs, wrappedTransclude);
        };
    };


    var wrapNgSwitchWhenCompileTransclude = function(transclude) {

        return function wrappedNgSwitchWhenCompileTransclude(scope, cloneLinkingFn) {

            var intermediateChildScope;
            var intermediateElement = angular.element('<span>');

            var createIntermediateChildScopeAndElement = function() {
                var result = scope.$new();
                transclude(result, wrappedCloneLinkingFn);

                return result;
            };

            var wrappedCloneLinkingFn = function wrappedCloneLinkingFn(clonedElement, scope) {
                intermediateElement.append(clonedElement);
                cloneLinkingFn(intermediateElement, scope);
            };

            intermediateChildScope = createIntermediateChildScopeAndElement();

            scope.$on('$routeChangeSuccess', function(event, current, previous) {
                var routeParamChanged = false;

                var currentAction = scope.$_currentAction();

                var purgeScopeOnRouteParams = current.paramsPerAction ? current.paramsPerAction[currentAction] : null;
                if (!purgeScopeOnRouteParams) {
                    return;
                }

                var purgeScopeOnRouteParamsLength = purgeScopeOnRouteParams.length;

                for (var i = 0; i < purgeScopeOnRouteParamsLength && !routeParamChanged; i++) {
                    routeParamChanged = isRouteParamChanged(current, previous, purgeScopeOnRouteParams[i]);
                }

                if (routeParamChanged) {
                    intermediateChildScope.$destroy();
                    intermediateElement.children().remove();

                    intermediateChildScope = createIntermediateChildScopeAndElement();
                }
            });
        };
    };

    var isRouteParamChanged = function(currentRoute, previousRoute, name) {
        return currentRoute.params[name] && previousRoute.params[name] &&
                currentRoute.params[name] !== previousRoute.params[name];
    };


    var requiredModules = [];

    if (angular.version.major > 1 || (angular.version.major === 1 && angular.version.minor >= 2)) {
        requiredModules.push('ngRoute');
    }


    angular.module('angularNestedViews.decoratedNgSwitchWhenDirective', requiredModules)
        .config(['$routeProvider', '$provide', function($routeProvider, $provide) {

            $provide.decorator('ngSwitchWhenDirective', ['$delegate', function($delegate) {
                var ngSwitchWhenDefinition = $delegate[0];

                if (!ngSwitchWhenCompileAlreadyWrapped) {
                    ngSwitchWhenDefinition.compile = wrapNgSwitchWhenCompile(ngSwitchWhenDefinition.compile);

                    ngSwitchWhenCompileAlreadyWrapped = true;
                }

                return $delegate;
            }]);
        }]);

}());